import {create} from "zustand";
import {immer} from "zustand/middleware/immer";
import {ActorRefFrom, createActor, createMachine, getNextSnapshot, transition } from "xstate";
import chalk from "chalk";

type Phase = 'write' | 'read' | 'update' | 'clear';
type PhaseEvent = "WRITE" | 'READ' | 'UPDATE' | 'CLEAR';
type OnTransititions = Partial<Record<PhaseEvent,Phase>>;
type PhaseType = "final" | "history" | "atomic" | "compound" | "parallel"

class PhaseManager {
    private actor:ActorRefFrom<typeof this.machine> | null = null;
    private clearFn:()=>void;

    constructor(clearFn:()=>void) { 
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
                'UPDATE':'update'
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
                this.clearFn();
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
    public sendToActor(phaseEvent:PhaseEvent):void {
        this.actor ||= this.createNewActor();
        this.verifyTransition(phaseEvent);
        this.actor.send({ type: phaseEvent });
    }
    public get phase():Phase {
        this.actor ||= this.createNewActor();
        return this.actor?.getSnapshot().value as Phase;
    }
    public protect(phases:Phase[],callback:()=>void):void {
        if (new Set(phases).has(this.phase)) {
            callback();
        }else throw new Error(chalk.red('State Error: ') + `The phase, ${this.phase}, is invalid for the called operation. Only these are allowed: ${phases}`);
    }
}
const phaseManager = new PhaseManager(()=>{
    console.log('called the cleanup function');
});

interface ResolutionState {
    count:number,
    increment:(num:number)=> void
};
const resolutionStore = create<ResolutionState>()(
    immer((set)=>({
        count:0,
        increment:(num:number):void => {
            phaseManager.protect(['write','update'],()=>set(state=>{
                state.count += num;
            }));
        }
    }))
);

console.log(phaseManager.phase);
// phaseManager.sendToActor('READ');
console.log(phaseManager.phase);

// console.log(resolutionStore.getState().count);
// resolutionStore.getState().increment(1);
// console.log(resolutionStore.getState().count);

phaseManager.sendToActor('UPDATE');
phaseManager.sendToActor('CLEAR');
console.log(phaseManager.phase);