import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { create,type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject,ExternalOptions } from "mutative/dist/interface.js";
import * as THREE from "three";

//i pasted this code in a perplexity chat and two gemini chat sessions--one per google account.
type ReadPhase = 'read';
type WritePhase = 'write' | 'update'
type ClearPhase = 'clear'
type Phase =  ReadPhase | WritePhase | ClearPhase;
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

export type GuardMode = 'dev' | 'prod';

interface Ref<T> {
    value:T
}
type ImmutableDraft<T> = DraftedObject<Immutable<Ref<T>>>;

class ClassType {
    public static isPrimitive(value:unknown):boolean {
        return (value === null) || (typeof value !== 'object')
    }
    public static isNativeObject(val: unknown): val is object | Array<unknown> | Map<unknown, unknown> | Set<unknown> {
        if (ClassType.isPrimitive(val)) return false;

        if (Array.isArray(val) || val instanceof Map || val instanceof Set) return true;
        
        const proto = Object.getPrototypeOf(val); 
        const isPlainObject = (proto === Object.prototype) || (proto === null);// It's a native class if the prototype is Object.prototype
        return isPlainObject
    };
    //Detects native built-ins that crash when wrapped in a Proxy.
    public static isNativeForeignClass = (val: unknown): boolean => {
        return (
            val instanceof Date ||
            val instanceof RegExp ||
            val instanceof Error ||
            (typeof Promise !== 'undefined' && val instanceof Promise) ||
            ArrayBuffer.isView(val) // TypedArrays like Float32Array
        );
    };
    //Detects custom classes that have only primitive properties.
    public static isCustomFlatClass(val:unknown): boolean {
        if (ClassType.isPrimitive(val) || ClassType.isNativeObject(val) || ClassType.isNativeForeignClass(val)) return false;
        return Object.values(val as object).every(prop => ClassType.isPrimitive(prop));
    };
    public static isComplexClass = (val: unknown):boolean => {
        if (ClassType.isPrimitive(val) || 
            ClassType.isNativeObject(val) || 
            ClassType.isNativeForeignClass(val)
        ) return false;
        return !ClassType.isCustomFlatClass(val);
    };
}

class PhaseManager<T> {
    public static orange = chalk.hex("#eeb18f");

    public immut:Immutable<Ref<T>>;
    public hasReadSinceLastWrite = false;

    private clearFn?:ClearFn<T>;
    private actorRef:ActorRefFrom<typeof this.machine> | null = null;
    private machine = createMachine({
        id:'phases',
        initial:'write',
        states:PhaseManager.phases
    });
    
    private static readonly phases:Record<Phase,{on?:OnTransititions,type?:PhaseType}> = {
        write:{
            on:{'READ':'read'}
        },
        read:{
            on:{
                'UPDATE':'update',
                'CLEAR':'clear'
            }
        },
        update:{
            on:{'READ':'read'}
        },
        clear:{
            type:'final'
        }
    }  as const;

    private static readonly mutativeOptions:ExternalOptions<false, true> = {
        enableAutoFreeze:true,
        mark:(target:unknown) => {//the mark function is used by mutative js recursively at each node level of the object
            if (ClassType.isNativeObject(target) || ClassType.isCustomFlatClass(target)) {
                return 'immutable'//return in a draft
            }
        }
    } as const;

    private static catchUntrappableRef(value:unknown) {
        if (ClassType.isNativeForeignClass(value)) {
            throw new Error(
                chalk.red(`Detected a native-foreign object: ${(value as object).constructor.name}.`) +
                PhaseManager.orange('\nMutations in this class are done outside of js which is beyond the reach of the guard.') 
            )
        }
        if (ClassType.isComplexClass(value)) {
            throw new Error(
                chalk.red(`Complex class detected: ${(value as object).constructor.name}.`) +
                PhaseManager.orange('\nNested objects in custom classes will not work as expected under the guard.') +
                chalk.dim(`\nConsider either converting ${ (value as object).constructor.name } to a nested plain object or ensure all its properties are primitives`)
            )
        }
    }
    constructor(ref:Ref<T>,clearFn?:typeof this.clearFn) { 
        PhaseManager.catchUntrappableRef(ref.value);
        this.clearFn = clearFn;
        this.immut = create(ref,()=>{},PhaseManager.mutativeOptions);
    }   
    private get actor() {
        if (this.actorRef === null) {
            this.actorRef = createActor(this.machine);
            this.actorRef.start();
            this.actorRef.subscribe(state=>{
                if (state.value === 'clear') {
                    if (this.clearFn) {
                        const clearFn = this.clearFn;
                        this.protect(state.value,['clear'],(draft=>clearFn(draft)))//will always succeed
                    }
                    this.actorRef = null;
                }
            });
        }
        return this.actorRef;
    }
    private verifyTransition(phaseEvent:PhaseEvent):void {
        const [{value:nextPhase}] = transition(
            this.machine,          
            this.actor.getSnapshot(),       
            { type: phaseEvent }   
        );
        if (this.phase === nextPhase) {//if the phase never changed,then the transition is invalid
            const message = chalk.red('\nTransition Error') + PhaseManager.orange(`\nCannot transition from ${this.phase} to ${phaseEvent}.`);
            throw new Error(message);
        }
        const endOfCycle = (nextPhase === 'update') || (nextPhase === "clear")
        if (endOfCycle) {
            if (!this.hasReadSinceLastWrite) {
                const message = chalk.red('\nProtocol Violation') + PhaseManager.orange('\nYou must call snapshot during the READ phase before transitioning to ',nextPhase.toUpperCase())
                throw new Error(message);
            }else this.hasReadSinceLastWrite = false;
        }
    }
    public transition(phaseEvent:PhaseEvent):void {
        this.verifyTransition(phaseEvent);
        this.actor.send({ type: phaseEvent });
    }
    public get phase():Phase {
        return this.actor.getSnapshot().value as Phase;
    }
    private proxyDraft(draft:ImmutableDraft<T>) {//this is to prevent reassignment of the value at the ref to a new object if its of the object type cuz deep freezing it again will be expensie and not doing so will bypass the guard immutable snapshots
        const isPrimitiveFunc = ClassType.isPrimitive;
        return new Proxy(draft, {
            set(target:ImmutableDraft<T>, prop:string | symbol, value:T) {
                const forbidReassignment = !isPrimitiveFunc(value);
                if (prop === 'value' && forbidReassignment) {
                    throw new Error(chalk.red('\nState Violation') + PhaseManager.orange('\nRoot replacement of object reference is forbidden.'));
                }
                return Reflect.set(target, prop, value);
            }
        });
    }
    //writes are fast through mutative js structural sharing algorithm but is O(S) where S is the number of modified nodes
    public protect(currentPhase:Phase,phases:Phase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        if (phases.includes(currentPhase)) { 
            this.immut = create(this.immut,
                draft=>{ callback(this.proxyDraft(draft)) },
                PhaseManager.mutativeOptions
            ) as Immutable<Ref<T>>;
        }else throw new Error(
            chalk.red('\nState Error') + 
            PhaseManager.orange(`\nThe state is in the ${currentPhase} phase but an operation expected it to be in the ${phases.toString().replace(',',' or ')} phase.`)
        );
    }
}
/**
 * The Guard class enforces Phase State Management.
 * This is means that there is a strict phase protocol on individual states that determines when different operations can happen and without any inteference with others.

 * 1. WRITE:  Allows mutating values before any reads but can also optionally read the state for its own mutation
 * 2. READ:   Allows reading the state through a snapshot - MUST acknowledge before UPDATE or CLEAR.Supports time travel states thanks to Mutative.js
 * 3. UPDATE: Allows updating the state after a read.Can transition back to read for a read-update cycle as used in games or long running programs
 * 4. CLEAR:  Reset the cycle.Automatically calls the clear function
 * 
 * Async IO: Any async io that will need the Guard's value must be done outside any guarded operation.
*/
type ClearFn<T> = (draft:ImmutableDraft<T> | Ref<T>)=>void;

export class Guard<T> {//removed access to the ref as a property in the guard
    public mut:Ref<T>;
    private manager:PhaseManager<T> | null = null;
    private clearFn?:ClearFn<T>;//keeping so that it can be called in prod mode for integrity even though the phase manager is skipped
    private static mode:GuardMode | null = null;
    
    constructor(initValue:T,cleanFn?:ClearFn<T>) {
        Guard.checkForMode();
        this.mut = {value:initValue};
        this.clearFn = cleanFn;
        if (Guard.mode === "dev") {
            this.manager = new PhaseManager(this.mut,cleanFn);
        }
    }
    private static checkForMode() {
        if (Guard.mode === null) {
            throw new Error(
                chalk.red('\nThe guard must be set to a mode first,i.e dev or prod,using the setMode static method before use.') +
                PhaseManager.orange('\nNote: ') + 
                chalk.green('Dev mode enforces the guard\'s protocol while prod mode strips it away for performance')
            )
        }
    }
    //O1 read because it directly returns the immutable instance rather than deep cloning the original source
    public snapshot():Immutable<T> | T {
        let ref:Immutable<Ref<T>> | Ref<T> | null = null;
        if (Guard.mode === 'dev') {
            this.manager!.protect(this.phase!,['read'],()=>{
                this.manager!.hasReadSinceLastWrite = true
                ref = this.manager!.immut;
            });
        }else {
            ref = this.mut;
        }
        return ref!.value;//directly return the value at the reference
    }
    /**
        * @param phases Allowed phases for this mutation.
        * @param callback SYNCHRONOUS mutation callback only.
        *                 Async IO must be done OUTSIDE using snapshot() first.
        * @example
        * const flag = new Guard(10)
        * 
        * flag.transition('READ')
        * const snapshot = flag.snapshot();
        * 
        * const result = await fetchData(snapshot.value);
        * flag.guard(['write','update'], (draft) => {//this means the below operation should be guarded under the write or update phase
        *     draft.value = result; 
        * });
    */
    public guard(phases:WritePhase[],callback:(draft:ImmutableDraft<T> | Ref<T>)=>void):void {
        if (Guard.mode === 'dev') {
            this.manager!.protect(this.phase!,phases,callback);//the phase is guaranteed to not be null in dev mode
        }else {
            callback(this.mut);
        }
    }
    /**Short hand method for calling the guard method for the write phase */
    public write(callback:(draft:ImmutableDraft<T> | Ref<T>)=>void) {
        this.guard(['write'],callback);
    }
    /**Short hand method for calling the guard method for the update phase */
    public update(callback:(draft:ImmutableDraft<T> | Ref<T>)=>void) {
        this.guard(['update'],callback);
    }
    public transition(phaseEvent:PhaseEvent) {
        if (Guard.mode === "prod") {
            if ((phaseEvent === "CLEAR") && this.clearFn) {
                this.clearFn(this.mut);
            }
            return
        }
        this.manager!.transition(phaseEvent);
    }
    public get phase():Phase | null {
        if (Guard.mode === 'prod') return null;//this will prevent calling the phase getter that will create a dormant actor in production
        return this.manager!.phase;
    }
    public static clearAll<U>(...states:Guard<U>[]) {
        for (const state of states) {
            state.transition('CLEAR');
        }
    }
    public static setMode(mode:GuardMode) {
        if (Guard.mode !== null) {
            throw new Error(chalk.red('\nThe mode can only be set once to prevent the production reference from being out of sync with the developer mode reference.'))
        }
        Guard.mode = mode;
    }
}
const start = performance.now();
Guard.setMode('prod');

async function someIO(value:number) {
    return value**2;
}

//Flat class example
const vec = new Guard(
    new THREE.Vector3(0,10,0),
    draft=>draft.value.set(0,0,0)
);
vec.transition('READ')
const initVec = vec.snapshot();

vec.transition('UPDATE');
vec.update(draft=>{
    draft.value.addScalar(10);
});
vec.transition('READ');
console.log('init vec: ',initVec);//this vec is a snapshot and unaffected by subsequent mutations
console.log('current vec: ',vec.snapshot());


//Primitive State
const flag = new Guard(10,draft=>draft.value=0);
console.log(flag.phase);

let externalNum = 10;

flag.write(draft=>{//write is the first phase.
    draft.value += 50;//reassigning the ref to a new value is allowed if its a primitive
    externalNum = draft.value;//primitives can be copied out of the guarded scope even before the guard allows the value to be read externally.This is safe cuz they are passed by value.
})
console.log('escaped primitive: ',externalNum);//logs 60.but try to keep mutations under guarded operations.even for primitives

flag.transition('READ');

const currentFlag = flag.snapshot();//It is mandatory to acknowledge the data.Else,proceeding to update will throw an error
console.log("Current flag acknowledged:",currentFlag);

flag.transition('UPDATE');

const newValue = await someIO(currentFlag);
flag.update(draft=>draft.value = newValue);//we fetch the data outside the guard

flag.transition('READ');
console.log("Updated flag from fetch:",flag.snapshot());

flag.transition('CLEAR');//automatically calls the stateless clear function that was set in the beginning

flag.transition('READ');//we must transition to read to see the value cuz after clear is a write.
console.log('Cleared flag: ',flag.snapshot());



//Native object state
let externalSet = new Set();
const grades:Guard<Set<string>> = new Guard(
    new Set(['A','B','C','D','E','F']),
    draft=>draft.value.clear()
);

grades.write(draft=>{//reassignment to a new set is forbidden
    draft.value.add('A+');
    draft.value.add('B-');
    externalSet = draft.value//non-primitives cant be copied out of the guarded scope.the draft is revoked.so you cant read the value externally unless the guard allows you to read it
});
console.log('Escaped reference: ',externalSet);

grades.transition('READ');
console.log('Current grades',grades.snapshot());

grades.transition('CLEAR');


//Using the clear all method
const a = new Guard(10,draft=>draft.value=0);
const b = new Guard(20,draft=>draft.value=0);
const c = new Guard(30,draft=>draft.value=0);

a.transition('READ');
b.transition('READ');
c.transition('READ');

console.log('Before clears: ',a.snapshot(),b.snapshot(),c.snapshot());
Guard.clearAll(a,b,c);//better than redundant calls to transition if they will be cleared at the same time

a.transition('READ');
b.transition('READ');
c.transition('READ');

console.log('After clears: ',a.snapshot(),b.snapshot(),c.snapshot());


// i encourage to do this instead if many states have identical lifecycles
const nums = new Guard({
    a:10,
    b:20,
    c:30
})

nums.transition('READ');
console.log('grouped states: ',nums.snapshot());
nums.transition('CLEAR');

const end = performance.now();
console.log('\nFinished in ',end-start,' milliseconds');