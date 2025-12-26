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
    private getDraft(draft:ImmutableDraft<T>): ImmutableDraft<T> {
        return new Proxy(draft, {
            get(target, prop, receiver) {
                if (prop === 'value') {
                    throw new Error(
                        chalk.red('Read Violation') + orange(
                            `\ndraft.value access is forbidden.The READ phase is not possible within a guard.Use the snapshot() method instead outside the guard.`
                        )
                    );
                }
                return Reflect.get(target, prop, receiver);
            }
        }) as ImmutableDraft<T>;
    }
    public protect(phases:Phase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        if (new Set(phases).has(this.phase)) { 
            this.immut = create(this.immut,(draft=>{
                callback(this.getDraft(draft))
            }));//the returned result can be a promise that can be awaited
        }else throw new Error(
            chalk.red('State Error') + 
            orange(`\nThe ${this.phase} phase is invalid for the called operation.\nIt is only valid for ${phases.toString()}.`)
        );
    }
}

export class Guard<T> {//removed access to the ref as a property in the guard
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
            result = this.manager.immut;
        });
        return result!;
    }
    /**
    * @param phases Allowed phases for this mutation.Read is not allowed.
    * @param callback SYNCHRONOUS mutation callback only.
    *                 Async IO must be done OUTSIDE using snapshot() first.
    * @example
    * const snapshot = flag.snapshot();
    * const result = await fetchData(snapshot.value);
    * flag.guard(['update'], (draft) => {
    *     draft.value = result; // ✅ Synchronous mutation only
    * });
    */
    public guard(phases:WritePhase[],callback:(draft:ImmutableDraft<T>)=>void):void {
        this.manager.protect(phases,callback);
    }
    public set(value:Immutable<T>) {
        this.manager.protect(['write', 'update'], (draft) => {
            draft.value = castDraft(value);
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


const flag = new Guard(10);
console.log(flag.phase);

flag.guard(['write'],(draft)=>{//write is the first phase.
    draft.value = 50;//so i can only initiate it with a value
})

flag.transition('READ')

//MANDATORY: Acknowledge the data.else,proceeding to update will throw an error
const current = flag.snapshot();
console.log("Current Value acknowledged:",current.value);

flag.transition('UPDATE');

const newValue = await someIO(current.value);
flag.set(newValue);//since update comes after read,i can update it with the value read in the read phase

flag.transition('READ');
console.log("Updated value:",flag.snapshot());

flag.transition('CLEAR');