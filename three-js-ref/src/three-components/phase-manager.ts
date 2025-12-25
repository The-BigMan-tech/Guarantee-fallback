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
    public protect(phases:Phase[],callback:(ref:Ref<T>)=>void):void | never {
        if (new Set(phases).has(this.phase)) {
            callback(this.ref);//passig the ref to the protect method while the ref prperty is private in the Safe class,it ensures that state utations are only allowed under centralized protected methods rather than everywhere in teh code
        }else throw new Error(chalk.red('State Error ') + orange(`\nThe '${this.phase}' phase is invalid for the called operation. \nIt is only valid for these phases: ${phases.toString()}`));
    }
}
export class Guard<T> {
    private ref:Ref<T>;
    private manager:PhaseManager<T>;

    constructor(initValue:T,cleanFn?:(ref:Ref<T>)=>void) {
        this.ref = {value:initValue};
        this.manager = new PhaseManager(this.ref,cleanFn);
    }
    public copy():T | never {//any caller that needs to access the value at the ref will get a copy
        let result:T | undefined = undefined;
        this.manager.protect(['read'],()=>{
            result = structuredClone(this.ref.value);
        });
        return result as T;//it cant be undefined here because it would have thrown an error.
    }
    public guard(phases:Phase[],callback:(ref:Ref<T>)=>void):void {
        this.manager.protect(phases,callback);
    }
    public transition(phaseEvent:PhaseEvent) {
        this.manager.transition(phaseEvent);
    }
    public get phase() {
        return this.manager.phase
    }
}
const health = new Guard(10);
console.log(health.phase);

health.transition('READ');
health.guard(['write'],ref=>{//will throw an error cuz this operation is guarded under write but its currently on read
    ref.value += 10
})
console.log(health.copy());