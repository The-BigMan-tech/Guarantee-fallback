import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { castDraft, create, type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject } from "mutative/dist/interface.js";

type ReadPhase = 'read';
type WritePhase = 'write' | 'update' | 'clear'
type Phase = ReadPhase | WritePhase;
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

interface Ref<T> {
    value:T
}
type ImmutableDraft<T> = DraftedObject<Immutable<Ref<T>>>;
const orange = chalk.hex("#eeb18f");


class PhaseManager<T> {
    private actor:ActorRefFrom<typeof this.machine> | null = null;
    private clearFn?:(draft:ImmutableDraft<T>)=>void;

    public immut:Immutable<Ref<T>>;
    public hasReadSinceLastWrite = false;

    constructor(ref:Ref<T>,clearFn?:typeof this.clearFn) { 
        this.clearFn = clearFn;
        this.actor = this.createNewActor();
        this.immut = create(ref,()=>{},{enableAutoFreeze:true});
    }
    private phases:Record<Phase,{on?:OnTransititions,type?:PhaseType}> = {
        write:{
            on:{
                'READ':'read',
            }
        },
        read:{
            on:{
                'UPDATE':'update',
                'CLEAR':'clear'
            }
        },
        update:{
            on:{
                'READ':'read'
            }
        },
        clear:{
            type:'final'
        }
    };
    private machine = createMachine({
        id:'phases',
        initial:'write',
        states:this.phases
    });
    private createNewActor() {
        const actor = createActor(this.machine);
        actor.start();
        actor.subscribe(phase=>{
            if (phase.status === "done") {
                this.actor = null;
                if (this.clearFn) {
                    const clearFn = this.clearFn;
                    this.immut = create(this.immut,(draft=>{
                        clearFn(draft);
                    }))
                }
            }
        });
        return actor;
    }
    private verifyTransition(phaseEvent:PhaseEvent):void {
        const [{value:nextPhase}] = transition(
            this.machine,          // Your machine
            this.actor!.getSnapshot(),       // The current actor snapshot
            { type: phaseEvent }   // Event to process
        );
        if (this.phase === nextPhase) {//if the phase never changed,then the transition is invalid
            throw new Error(
                chalk.red('Transition Error') + orange(`\nCannot transition from ${this.phase} to ${phaseEvent}.`)
            );
        }
        const endOfCycle = (nextPhase === 'update') || (nextPhase === "clear")
        if (endOfCycle) {
            if (!this.hasReadSinceLastWrite) {
                throw new Error(
                    chalk.red('Protocol Violation') + orange('\nYou must call snapshot during the READ phase before transitioning to ',nextPhase.toUpperCase())
                );
            }else this.hasReadSinceLastWrite = false;
        }
    }
    public transition(phaseEvent:PhaseEvent):void {
        this.actor ||= this.createNewActor();
        this.verifyTransition(phaseEvent);
        this.actor.send({ type: phaseEvent });
    }
    public get phase():Phase {
        this.actor ||= this.createNewActor();
        return this.actor?.getSnapshot().value as Phase;
    }
    public protect(phases:Phase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        if (new Set(phases).has(this.phase)) { 
            this.immut = create(this.immut,(draft=>{//writes are fast through mutative js structural sharing algorithm
                callback(draft)
            }));//the returned result can be a promise that can be awaited
        }else throw new Error(
            chalk.red('State Error') + 
            orange(`\nThe ${this.phase} phase is invalid for the called operation.\nIt is only valid for ${phases.toString()}.`)
        );
    }
}
/**
 * The Gate class enforces Gated State Management.
 * This is means that there is a strict phase protocol on individual states without any integration inteference with others.

 * 1. WRITE:  Allows mutating values before any reads but can also optionally read the state for its own mutation
 * 2. READ:   Allows reading the state through a snapshot - MUST acknowledge before UPDATE or CLEAR.Supports time travel states thanks to Mutative.js
 * 3. UPDATE: Allows updating the state after a read.Can transition back to read for a read-update cycle as used in games or long running programs
 * 4. CLEAR:  Reset the cycle.Automatically calls the clear function
 * 
 * Async IO: Any async io that will need the Gate's value must be done outside any guarded operation.
 */
export class Gate<T> {//removed access to the ref as a property in the guard
    private manager:PhaseManager<T>;

    constructor(initValue:T,cleanFn?:(draft:ImmutableDraft<T>)=>void) {
        const ref = {value:initValue};
        this.manager = new PhaseManager(ref,cleanFn);
    }
    //O1 read because it directly returns the immutable instance rather than deep cloning the original source
    public snapshot():Immutable<Ref<T>> {
        let result:Immutable<Ref<T>> | null = null;
        this.manager.protect(['read'],()=>{
            this.manager.hasReadSinceLastWrite = true
            result = this.manager.immut;//the reason why i didnt do a direct return is to protect reading the reference under the read phase
        });
        return result!;
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
    public set(callback:(prev:Immutable<T>)=>Immutable<T>) {
        this.manager.protect(['write', 'update'], (draft) => {
            draft.value = castDraft(callback(draft.value as Immutable<T>));
        });
    }   
    public transition(phaseEvent:PhaseEvent) {
        this.manager.transition(phaseEvent);
    }
    public get phase() {
        return this.manager.phase
    }
}
async function someIO(value:number) {
    return value**2;
}

const flag = new Gate(10,(draft=>draft.value=0));
console.log(flag.phase);

flag.guard(['write'],(draft)=>{//write is the first phase.
    draft.value += 50;//so i can only initiate it with a value
})

flag.transition('READ')

//MANDATORY: Acknowledge the data.Else,proceeding to update will throw an error
const current = flag.snapshot();
console.log("Current Value acknowledged:",current.value);

flag.transition('UPDATE');

const newValue = await someIO(current.value);
flag.set(()=>newValue);//the set method is a shorthand for simple updates like primitives

flag.transition('READ');
console.log("Updated value:",flag.snapshot());

flag.transition('CLEAR');

flag.transition('READ');
console.log(flag.snapshot().value);

const grades:Gate<Set<string>> = new Gate(
    new Set(['A','B','C','D','E','F']),
    (draft)=>draft.value.clear()
);

grades.guard(['write'],(draft)=>{
    draft.value.add('A+');
    draft.value.add('B-');
});

grades.transition('READ');
console.log(grades.snapshot().value);