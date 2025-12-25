import {type ActorRefFrom, createActor, createMachine,transition } from "xstate";
import chalk from "chalk";

type Phase = 'write' | 'read' | 'update' | 'clear';
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

interface Ref<T> {
    value:T
}
const orange = chalk.hex("#ea986c");

//by making it support async,it can work for tasks where the mutation scope should be tight but also allows it to scope an entire block of operations that should be guarded while uses the guard's value to fetch data without using a potentially stale snapshot from the outside
class PhaseManager<T> {
    private ref:Ref<T>;
    private clearFn?:(ref:Ref<T>)=>void;
    private actor:ActorRefFrom<typeof this.machine> | null = null;

    constructor(ref:Ref<T>,clearFn?:typeof this.clearFn) { 
        this.ref = ref;
        this.clearFn = clearFn;
        this.actor = this.createNewActor();
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
                'CLEAR':'clear'
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
                if (this.clearFn) this.clearFn(this.ref);
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
        if (this.phase === nextPhase) {
            throw new Error(chalk.red('Invalid Transition:') + orange(` Cannot send event "${phaseEvent}" from phase "${this.phase}".`));
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
    public protect<R>(phases:Phase[],callback:(ref:Ref<T>)=>R):R {
        if (new Set(phases).has(this.phase)) { 
            const result = callback(this.ref);//passing the ref to the protect method while the ref prperty is private in the Guard class,it ensures that state utations are only allowed under centralized protected methods rather than everywhere in the code.And passing the mutabe ref directly prevents unnecessary complexity by introducing immutable drafts.It believes that every mutation under the guard is intentional
            return result;
        }else throw new Error(
            chalk.red('State Error ') + 
            orange(`\nThe '${this.phase}' phase is invalid for the called operation. \nIt is only valid for these phases: ${phases.toString()}`)
        );
    }
}
//it is recommended that any async data that is to be used inside the callback of the guard method should be fetched inside the guard itself.This to prevent wasting resources on an io operation that is potentially bound to fail because of an invalid state and also prevents situations where one guarded operation overwrite the effect of another with a stale state

export class Guard<T> {
    private ref:Ref<T>;
    private manager:PhaseManager<T>;

    constructor(initValue:T,cleanFn?:(ref:Ref<T>)=>void) {
        this.ref = {value:initValue};
        this.manager = new PhaseManager(this.ref,cleanFn);
    }
    public snapshot():T {//any caller that needs to access the value at the ref will get a copy
        return this.manager.protect(['read'],()=>{
            return structuredClone(this.ref.value);
        });
    }
    public guard<R>(phases:Phase[],callback:(ref:Ref<T>)=>R):R {
        return this.manager.protect(phases,callback);
    }
    public transition(phaseEvent:PhaseEvent) {
        this.manager.transition(phaseEvent);
    }
    public get phase() {
        return this.manager.phase
    }
}
const flag = new Guard(10);
console.log(flag.phase);

async function someIO(value:number) {
    return value + 10
}
await flag.guard(['write'],async (ref)=>{//will throw an error cuz this operation is guarded under write but its currently on read
    ref.value += await someIO(ref.value);
})
flag.transition('READ')//Must call first,else,reading the snapshot will throw an error
console.log(flag.snapshot());