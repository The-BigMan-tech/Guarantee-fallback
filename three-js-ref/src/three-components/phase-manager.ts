import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import { castDraft, create, type Immutable } from 'mutative';
import chalk from "chalk";
import type { DraftedObject } from "mutative/dist/interface.js";


type Phase = 'write' | 'read' | 'update' | 'clear';
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

interface Ref<T> {
    value:T
}
type ImmutableDraft<T> = DraftedObject<Immutable<Ref<T>>>;
const orange = chalk.hex("#eeb18f");

//by making it support async,it can work for tasks where the mutation scope should be tight but also allows it to scope an entire block of operations that should be guarded while uses the guard's value to fetch data without using a potentially stale snapshot from the outside
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
                chalk.red('Transition Error') + 
                orange(`\nCannot transition from ${this.phase} to ${phaseEvent}.`)
            );
        }
        const endOfCycle = (nextPhase === 'update') || (nextPhase === "clear")
        if (endOfCycle) {
            if (!this.hasReadSinceLastWrite) {
                throw new Error(
                    chalk.red('Protocol Violation') + 
                    orange('\nYou must call snapshot during the READ phase before transitioning to ',nextPhase.toUpperCase())
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
    public protect<R>(phases:Phase[],callback:(draft:ImmutableDraft<T>)=>R):R {
        if (new Set(phases).has(this.phase)) { 
            let result:R | null = null;
            this.immut = create(this.immut,(draft=>{
                result = callback(draft);//the returned result can be a promise that can be awaited
            }));
            return result!;
        }else throw new Error(
            chalk.red('State Error') + 
            orange(`\nThe ${this.phase} phase is invalid for the called operation.\nIt is only valid for ${phases.toString()}.`)
        );
    }
}
//it is recommended that any async data that is to be used inside the callback of the guard method should be fetched inside the guard itself.This to prevent wasting resources on an io operation that is potentially bound to fail because of an invalid state and also prevents situations where one guarded operation overwrite the effect of another with a stale state

export class Guard<T> {//removed access to the ref as a property in the guard
    private manager:PhaseManager<T>;

    constructor(initValue:T,cleanFn?:(draft:ImmutableDraft<T>)=>void) {
        const ref = {value:initValue};
        this.manager = new PhaseManager(ref,cleanFn);
    }
    public snapshot():Immutable<Ref<T>> {//any caller that needs to access the value at the ref will get a copy
        return this.manager.protect(['read'],()=>{
            this.manager.hasReadSinceLastWrite = true
            return this.manager.immut;
        });
    }
    public guard<R>(phases:Phase[],callback:(draft:ImmutableDraft<T>)=>R):R {
        return this.manager.protect(phases,callback);
    }
    public set(callback: (prev: T) =>Immutable<T>) {
        this.manager.protect(['write', 'update'], (draft) => {
            draft.value = castDraft(callback(draft.value as T));
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
    return value + 10
}


const flag = new Guard(10);
console.log(flag.phase);

await flag.guard(['write'],async (draft)=>{
    await someIO(draft.value);
})

flag.transition('READ')

//MANDATORY: Acknowledge the data
const x = flag.snapshot();
console.log("Current Value acknowledged:",x.value);

flag.transition('UPDATE');
flag.set(()=>90);

flag.transition('READ');
console.log("Updated value:",flag.snapshot());

flag.transition('CLEAR');