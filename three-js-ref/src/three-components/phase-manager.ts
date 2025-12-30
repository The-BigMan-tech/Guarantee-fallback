import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { create,type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject } from "mutative/dist/interface.js";
import * as THREE from "three";

type ReadPhase = 'read';
type WritePhase = 'write' | 'update'
type ClearPhase = 'clear'
type Phase =  ReadPhase | WritePhase | ClearPhase;
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

interface Ref<T> {
    value:T
}
type ImmutableDraft<T> = DraftedObject<Immutable<Ref<T>>>;

class PhaseManager<T> {
    public immut:Immutable<Ref<T>>;
    public hasReadSinceLastWrite = false;

    private actorRef:ActorRefFrom<typeof this.machine> | null = null;
    private clearFn?:(draft:ImmutableDraft<T>)=>void;

    private static orange = chalk.hex("#eeb18f");

    private static phases:Record<Phase,{on?:OnTransititions,type?:PhaseType}> = {
        write:{
            on:{'READ':'read',}
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
    };
    private machine = createMachine({
        id:'phases',
        initial:'write',
        states:PhaseManager.phases
    });

    constructor(ref:Ref<T>,clearFn?:typeof this.clearFn) { 
        this.clearFn = clearFn;
        this.immut = create(ref,()=>{},{enableAutoFreeze:true});
    }
    private get actor() {
        if (this.actorRef === null) {
            this.actorRef = createActor(this.machine);
            this.actorRef.start();
            this.actorRef.subscribe(state=>{
                if (state.status === "done") {
                    this.actorRef = null;
                    if (this.clearFn) {
                        const clearFn = this.clearFn;
                        this.immut = create(this.immut,(draft=>{
                            clearFn(draft);
                        }))
                    }
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
    private isObject(value:unknown):boolean {
        return value === Object(value);
    }
    private proxyDraft(draft:ImmutableDraft<T>) {//this is to prevent reassignment of the value at the ref to a new object if its of the object type cuz deep freezing it again will be expensie and not doing so will bypass the guard immutable snapshots
        const isObject = this.isObject;
        return new Proxy(draft, {
            set(target:ImmutableDraft<T>, prop:string | symbol, value:T) {
                if (prop === 'value' && isObject(value)) {
                    throw new Error(chalk.red('\nState Violation') + PhaseManager.orange('\nRoot replacement of object reference is forbidden'));
                }
                return Reflect.set(target, prop, value);
            }
        });
    }
    //writes are fast through mutative js structural sharing algorithm
    public protect(phases:Phase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        if (new Set(phases).has(this.phase)) { 
            this.immut = create(this.immut,(draft=>{ callback(this.proxyDraft(draft)) }));
        }else throw new Error(
            chalk.red('\nState Error') + 
            PhaseManager.orange(`\nThe state is in the ${this.phase} phase but an operation expected it to be in the ${phases.toString().replace(',',' or ')} phase.`)
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
 * Async IO: Any async io that will need the Gate's value must be done outside any guarded operation.
*/
export class Guard<T> {//removed access to the ref as a property in the guard
    private manager:PhaseManager<T>;

    constructor(initValue:T,cleanFn?:(draft:ImmutableDraft<T>)=>void) {
        const ref = {value:initValue};
        this.manager = new PhaseManager(ref,cleanFn);
    }
    //O1 read because it directly returns the immutable instance rather than deep cloning the original source
    public snapshot():Immutable<T> {
        let ref:Immutable<Ref<T>> | null = null;
        this.manager.protect(['read'],()=>{
            this.manager.hasReadSinceLastWrite = true
            ref = this.manager.immut;//the reason why i didnt do a direct return is to protect reading the reference under the read phase
        });
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
        * flag.guard(['update'], (draft) => {
        *     draft.value = result; // ✅ Synchronous mutation only
        * });
    */
    public guard(phases:WritePhase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        this.manager.protect(phases,callback);
    }
    public write(callback:(draft:ImmutableDraft<T>)=>void) {
        this.manager.protect(['write'],callback);
    }
    public update(callback:(draft:ImmutableDraft<T>)=>void) {
        this.manager.protect(['update'],callback);
    }
    public transition(phaseEvent:PhaseEvent) {
        this.manager.transition(phaseEvent);
    }
    public get phase() {
        return this.manager.phase
    }
    public static clearAll<U>(...states:Guard<U>[]) {
        for (const state of states) {
            state.transition('CLEAR');
        }
    }
}
async function someIO(value:number) {
    return value**2;
}

const flag = new Guard(10,draft=>draft.value=0);
console.log(flag.phase);

let externalNum = 10;

flag.write(draft=>{//write is the first phase.
    draft.value += 50;//so i can only initiate it with a value
    externalNum = draft.value;//primitives can be copied out of the guarded scope even before the gate allows the value to be read externally
})
console.log(externalNum);//logs 60

flag.transition('READ')

//MANDATORY: Acknowledge the data.Else,proceeding to update will throw an error
const snap = flag.snapshot();
console.log("Current Value acknowledged:",snap);

flag.transition('UPDATE');

const newValue = await someIO(snap);
flag.update(draft=>draft.value = newValue);//the set method is a shorthand for simple updates like primitives

flag.transition('READ');
console.log("Updated value:",flag.snapshot());

flag.transition('CLEAR');

flag.transition('READ');
console.log(flag.snapshot());


let externalSet = new Set();
const grades:Guard<Set<string>> = new Guard(
    new Set(['A','B','C','D','E','F']),
    draft=>draft.value.clear()
);

grades.write(draft=>{
    draft.value.add('A+');
    draft.value.add('B-');
    externalSet = draft.value//non-primitives cant be copied out of the guarded scope.the draft is revoked.so you cant read the value externally unless the guard allows you to read it
});
console.log(externalSet);

grades.transition('READ');
console.log(grades.snapshot());



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
console.log(nums.snapshot());


const vec = new Guard(
    new THREE.Vector3(),
    draft=>draft.value.set(0,0,0)
);
vec.write(draft=>{
    // draft.value = new THREE.Vector3();//this will throw an error.
    draft.value.addScalar(3);
});

vec.transition('READ')
const x = vec.snapshot();
x.addScalar(10)
console.log(vec.snapshot());