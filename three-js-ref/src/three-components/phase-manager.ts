import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { create,type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject,ExternalOptions } from "mutative/dist/interface.js";

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
type PassedRef<T> = ImmutableDraft<T> | Ref<T>;


class ClassTypeUtil {
    public static isPrimitive(value:unknown):boolean {
        return (value === null) || (typeof value !== 'object')
    }
    public static isNativeObject(val: unknown): val is object | Array<unknown> | Map<unknown, unknown> | Set<unknown> {
        if (ClassTypeUtil.isPrimitive(val)) return false;

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
    public static isCustomClass(val:unknown):boolean {
        return (
            !this.isPrimitive(val) && 
            !this.isNativeObject(val) && 
            !this.isNativeForeignClass(val)
        );
    }
}

class PhaseManager<T> {
    public static orange = chalk.hex("#eeb18f");

    public immut:Immutable<Ref<T>>;
    public clearFn:ClearFn<T> | null = null;
    public hasReadSinceLastWrite = false;

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
            if (ClassTypeUtil.isNativeObject(target) || ClassTypeUtil.isCustomClass(target)) {
                return 'immutable'//return in a draft
            }
            if (ClassTypeUtil.isNativeForeignClass(target)) {
                throw new Error(
                    chalk.red(`Detected a native-foreign object: ${(target as object).constructor.name}.`) +
                    PhaseManager.orange('\nMutations in this class are done outside of js which is beyond the reach of the guard.') 
                )
            }
        }
    } as const;

    constructor(ref:Ref<T>) { 
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
            const message = chalk.red('\nTransition Error') + PhaseManager.orange(`\nCannot transition from ${this.phase} to ${phaseEvent.toLowerCase()}.`);
            throw new Error(message);
        }
        const afterRead = (nextPhase === 'update') || (nextPhase === "clear")
        if (afterRead) {
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
    //writes are fast through mutative js structural sharing algorithm but is O(S) where S is the number of modified nodes
    public protect(currentPhase:Phase,phases:Phase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        if (phases.includes(currentPhase)) { 
            this.immut = create(
                this.immut,
                draft=>{ callback(draft) },
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
    private mut:Ref<T>;
    private manager:PhaseManager<T> | null = null;
    private clearFn:ClearFn<T> | null = null;//keep aref to the clearFn outside the manager so that it can be called in prod mode for integrity even though the phase manager is skipped
    private static mode:GuardMode | null = null;
    
    constructor(initValue:T) {
        Guard.checkForMode();
        this.mut = {value:initValue};
        if (Guard.mode === "dev") {
            this.manager = new PhaseManager(this.mut);
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
            const manager = this.manager!;
            manager.protect(this.phase!,['read'],()=>{
                manager.hasReadSinceLastWrite = true
                ref = manager.immut;
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
    public guard(phases:WritePhase[],callback:(draft:PassedRef<T>)=>void):void {
        if (Guard.mode === 'dev') {
            this.manager!.protect(this.phase!,phases,callback);//the phase is guaranteed to not be null in dev mode
        }else {
            callback(this.mut);
        }
    }
    /**Short hand method for calling the guard method for the write phase */
    public write(callback:(draft:PassedRef<T>)=>void) {
        this.guard(['write'],callback);
    }
    /**Short hand method for calling the guard method for the update phase */
    public update(callback:(draft:PassedRef<T>)=>void) {
        this.guard(['update'],callback);
    }
    public transition(phaseEvent:PhaseEvent) {
        if (Guard.mode === "prod") {
            if ((phaseEvent === "CLEAR") && this.clearFn) {//we want to still call the clear function even in production mode that wont trigger a transition
                this.clearFn(this.mut);
            }
            return this
        }
        this.manager!.transition(phaseEvent);
        return this;
    }
    public get phase():Phase | null {
        if (Guard.mode === 'prod') return null;//this will prevent calling the phase getter that will create a dormant actor in production
        return this.manager!.phase;
    }
    public onClear(clearFn:ClearFn<T>):Guard<T> {//returning the guard object allows for chaining at the constructor
        this.clearFn = clearFn;
        if (this.manager) this.manager.clearFn = this.clearFn;
        return this;
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
