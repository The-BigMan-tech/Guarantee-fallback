import {ActorRefFrom, createActor, createMachine,transition } from "xstate";
import chalk from "chalk";

type Phase = 'write' | 'read' | 'update' | 'clear';
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

interface Ref<T> {
    value:T
}
export class PhaseManager<T> {
    private ref:Ref<T>;
    private clearFn:(ref:Ref<T>)=>void;
    private actor:ActorRefFrom<typeof this.machine> | null = null;

    constructor(ref:Ref<T>,clearFn:typeof this.clearFn) { 
        this.ref = ref;
        this.clearFn = clearFn;
        this.actor = this.createNewActor();
    }
    private phases:Record<Phase,{on?:OnTransititions,type?:PhaseType}> = {
        write:{
            on:{
                'READ':'read'
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
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    private createNewActor() {
        const actor = createActor(this.machine);
        actor.start();
        actor.subscribe(phase=>{
            if (phase.status === "done") {
                this.actor = null;
                this.clearFn(this.ref);
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
            throw new Error(chalk.red('Invalid Transition:') + ` Cannot send event "${phaseEvent}" from phase "${this.phase}".`);
        }
    }
    public send(phaseEvent:PhaseEvent):void {
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
        }else throw new Error(chalk.red('State Error: ') + `The phase, ${this.phase}, is invalid for the called operation. Only these are allowed: ${phases}`);
    }
}
export class Safe<T> {
    private ref:Ref<T>;
    public manager:PhaseManager<T>;

    constructor(value:T,cleanFn:(ref:Ref<T>)=>void) {
        this.ref = {value};
        this.manager = new PhaseManager(this.ref,cleanFn);
    }
    public copy():T | never {//any caller that needs to access the value at the ref will get a copy
        let result:T | undefined = undefined;
        this.manager.protect(['read'],()=>{
            result = structuredClone(this.ref.value);
        });
        return result as T;//it cant be undefined here because it would have thrown an error.
    }
}