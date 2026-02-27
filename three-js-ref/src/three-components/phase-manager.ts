import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { create,type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject,ExternalOptions } from "mutative/dist/interface.js";
import {Mutex} from "async-mutex";

//i pasted this code in a perplexity chat and gemini chat sessions
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
type ProtectedCallback<T,U> = (draft:PassedRef<T>)=>U
type ProtectMethod<T,U> = (currentPhase:Phase,phases:Phase[],callback:ProtectedCallback<T,U>)=>U

type ClearFn<T,U> = (draft:ImmutableDraft<T> | Ref<T>)=>U;
type Flow = 'sync' | 'async';
type SyncCallbackReturn = void | { [K in keyof Promise<unknown>]: never };

interface Common {
    phase():Phase | null,
}
interface SyncGuard<T> extends Common {
    snapshot(): Immutable<T> | T;
    guard():(phases:Phase[],callback:ProtectedCallback<T,SyncCallbackReturn>)=>void;
    update:(callback:ProtectedCallback<T,SyncCallbackReturn>)=>void,
    write:(callback:ProtectedCallback<T,SyncCallbackReturn>)=>void,
    transition(event: PhaseEvent): this;
    cleanup(clearFn:ClearFn<T,SyncCallbackReturn>):this;
    readonly():SyncReadonlyGuard<T>;
}
interface AsyncGuard<T> extends Common {
    snapshot():Promise<Immutable<T> | T>;
    guard():(phases:Phase[],callback:ProtectedCallback<T,Promise<void>>)=>Promise<void>
    update:(callback:ProtectedCallback<T,Promise<void>>)=>Promise<void>,
    write:(callback:ProtectedCallback<T,Promise<void>>)=>Promise<void>,
    transition(event: PhaseEvent): Promise<this>;
    cleanup(clearFn:ClearFn<T,Promise<void>>):this;
    readonly():AsyncReadonlyGuard<T>;
}
interface SyncReadonlyGuard<T> extends Common {
    snapshot(): ReturnType<SyncGuard<T>['snapshot']>;
}

interface AsyncReadonlyGuard<T> extends Common {
    snapshot(): ReturnType<AsyncGuard<T>['snapshot']>;
}

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
                    this.actorRef?.stop()
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
    private validatePhase(currentPhase:Phase,phases:Phase[]) {
        if (!phases.includes(currentPhase)) {
            throw new Error(
                chalk.red('\nState Error') + 
                PhaseManager.orange(`\nThe state is in the ${currentPhase} phase but an operation expected ${phases.toString()}`)
            );
        }
    }
    //writes are fast through mutative js structural sharing algorithm but is O(S) where S is the number of modified nodes
    public protect:ProtectMethod<T,void> = (currentPhase,phases,callback)=> {
        this.validatePhase(currentPhase,phases);
        this.immut = create(
            this.immut,
            draft=>{ callback(draft) },
            PhaseManager.mutativeOptions
        ) as Immutable<Ref<T>>;
    }
    public protectAsync:ProtectMethod<T,Promise<void>> = async(currentPhase,phases,callback)=>{
        this.validatePhase(currentPhase,phases);
        this.immut = await create(
            this.immut,
            async draft=>{ await callback(draft) },
            PhaseManager.mutativeOptions
        ) as Immutable<Ref<T>>;
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
export class ReadonlyGuard<T> {
    private guard:Guard<T>;

    constructor(guard:Guard<T>) {
        this.guard = guard;
    }
    public get phase() {
        return this.guard.phase;
    }
    public snapshot() {
        return this.guard.snapshot();
    }
    
}
export class Guard<T> {//removed access to the ref as a property in the guard
    private mut:Ref<T>;
    private manager:PhaseManager<T> | null = null;
    private clearFn:ClearFn<T,void | Promise<void>> | null = null;//keep aref to the clearFn outside the manager so that it can be called in prod mode for integrity even though the phase manager is skipped
    private controlFlow:Flow | null = null;
    private mutex = new Mutex();
    private static mode:GuardMode | null = null;
    
    constructor(initValue:T) {
        Guard.checkForMode();
        this.mut = {value:initValue};
        if (Guard.mode === "dev") {
            this.manager = new PhaseManager(this.mut);
        }
    }

    public static clearAll<U>(...states:Guard<U>[]) {
        for (const state of states) {
            state.transition('CLEAR');
        }
    }
    public static setMode(mode:GuardMode) {
        if (Guard.mode !== null) {
            throw new Error(chalk.red('\nThe mode can only be set once to prevent the production and developer reference from being out of sync.'))
        }
        Guard.mode = mode;
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
    
    private checkIfFlowIsNull() {
        if (this.controlFlow == null) {
            throw new Error(chalk.red('The guard control flow must be set to either sync or async before use'));
        }
    }
    private checkIfFlowIsSet() {
        if (this.controlFlow !== null) {
            throw new Error(chalk.red('The flow can only be set once'))
        }
    }
    public sync():SyncGuard<T> {
        this.checkIfFlowIsSet();
        this.controlFlow = 'sync';
        return this as unknown as SyncGuard<T>;
    }
    public async():AsyncGuard<T> {
        this.checkIfFlowIsSet();
        this.controlFlow = 'async';
        return this as unknown as AsyncGuard<T>;
    }
    public readonly() {
        this.checkIfFlowIsNull();
        return new ReadonlyGuard(this) 
    }
    //Snapshot functions
    //O1 read because it directly returns the immutable instance rather than deep cloning the original source
    private snapshotSync():Immutable<T> | T {
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
    private async snapshotAsync():Promise<Immutable<T> | T> {
        const release = await this.mutex.acquire();
        try {
            return this.snapshotSync();
        } finally {
            release();
        }
    }
    public snapshot() {
        this.checkIfFlowIsNull();
        if (this.controlFlow === 'sync') {
            return this.snapshotSync();
        }else {
            return this.snapshotAsync();
        }
    }

    //Guard functions
    private guardSync(phases:Phase[],callback:ProtectedCallback<T,void>) {
        if (Guard.mode === 'dev') {
            this.manager!.protect(this.phase!,phases,callback);//the phase is guaranteed to not be null in dev mode
        }else {
            callback(this.mut);
        }
    }
    private async guardAsync(phases:Phase[],callback:ProtectedCallback<T,Promise<void>>)  {
        const release = await this.mutex.acquire();
        try {
            if (Guard.mode === 'dev') {
                await this.manager!.protectAsync(this.phase!,phases,callback);//the phase is guaranteed to not be null in dev mode
            }else {
                await callback(this.mut);
            }
        }finally {
            release();
        }
    }
    public guard (phases:Phase[],callback:ProtectedCallback<T,void | Promise<void>>) {
        this.checkIfFlowIsNull();
        if (this.controlFlow === 'sync') {
            return this.guardSync(phases,callback);
        }else {
            return this.guardAsync(phases,callback as ProtectedCallback<T,Promise<void>>)
        }
    }


    /**Short hand method for calling the guard method for the write phase */
    private writeSync(callback:ProtectedCallback<T,void>) {
        this.guard(['write'],callback);
    }
    private async writeAsync(callback:ProtectedCallback<T,Promise<void>>) {
        await this.guard(['write'],callback);
    }
    public write(callback:ProtectedCallback<T,void | Promise<void>>) {
        if (this.controlFlow === 'sync') {
            return this.writeSync(callback);
        }else {
            return this.writeAsync(callback as ProtectedCallback<T,Promise<void>>)
        }
    }

    /**Short hand method for calling the guard method for the update phase */
    private updateSync(callback:ProtectedCallback<T,void>) {
        this.guard(['update'],callback);
    }
    private async updateAsync(callback:ProtectedCallback<T,Promise<void>>) {
        await this.guard(['update'],callback);
    }
    public update(callback:ProtectedCallback<T,void | Promise<void>>) {
        if (this.controlFlow === 'sync') {
            return this.updateSync(callback);
        }else {
            return this.updateAsync(callback as ProtectedCallback<T,Promise<void>>)
        }
    }

    //Transition functions
    private callClear(phaseEvent:PhaseEvent) {
        return ((phaseEvent === "CLEAR") && this.clearFn) 
    }
    private transitionSync(phaseEvent:PhaseEvent) {
        if (Guard.mode === 'dev') {
            this.manager!.transition(phaseEvent);
        }
        if (this.callClear(phaseEvent)) {
            if (Guard.mode === "prod") {
                this.clearFn!(this.mut);//we still want to call the clear function even in production mode that wont trigger a transition
            }else {
                this.write(this.clearFn!);//it should be in the write phase after the clear which is why i used write here.as it is,the guard uses the write phase as the opportunity to clear it and not in the actual clear itself but its the same
            }
        }
        return this;
    }
    private async transitionAsync(phaseEvent:PhaseEvent) {
        const release = await this.mutex.acquire();
        try {
            if (Guard.mode === 'dev') {
                this.manager!.transition(phaseEvent);
            }
            if (this.callClear(phaseEvent)) {
                if (Guard.mode === "prod") {
                    await this.clearFn!(this.mut);//we still want to call the clear function even in production mode that wont trigger a transition
                }else {
                    const currentPhase = this.manager!.phase;
                    await this.manager!.protectAsync(
                        currentPhase, ['write'], 
                        this.clearFn as ClearFn<T,Promise<void>>
                    );
                }
            }
            return this;
        }finally {
            release();
        }
    }
    public transition(phaseEvent:PhaseEvent) {
        this.checkIfFlowIsNull();
        if (this.controlFlow === 'sync') {
            return this.transitionSync(phaseEvent);
        }else {
            return this.transitionAsync(phaseEvent)
        }
    }

    //Other functions
    public get phase():Phase | null {
        this.checkIfFlowIsNull();
        if (Guard.mode === 'prod') return null;//this will prevent calling the phase getter that will create a dormant actor in production
        return this.manager!.phase;
    }
    public cleanup(clearFn:ClearFn<T,void | Promise<void>>):Guard<T> {//returning the guard object allows for chaining at the constructor
        this.checkIfFlowIsNull();
        if (this.clearFn) {
            throw new Error(chalk.red('The clear function can only be set once'))
        }else {
            this.clearFn = clearFn;
            return this;
        }
    }
}
