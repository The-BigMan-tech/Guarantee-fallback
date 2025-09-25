import { Dependent } from "../utils/utils.js";
import { PhaseManager } from "./phase-manager.js";
import {create} from "zustand";
import {immer} from "zustand/middleware/immer";

export interface ResolutionState {
    dependen:(Dependent | null)[],
    updateDependen:(dependents:(Dependent | null)[])=>void,
};

export const phaseManager = new PhaseManager();

const resolutionStore = create<ResolutionState>()(
    immer((set)=>({
        dependen:[],
        updateDependen:(dependents):void => {
            phaseManager.protect(['write','update','clear'],()=>set(state=>{
                state.dependen = [...dependents];
            }));
        }
    }))
);

export function state<T extends keyof ResolutionState>(value:T):ResolutionState[T] {
    if (typeof value !== "function") {
        return phaseManager.protect(['read'],()=>{
            const data = structuredClone(resolutionStore.getState()[value]);
            return data;
        });
    }
    return resolutionStore.getState()[value];
};

phaseManager.clearFn = ():void =>{
    console.log('called the clear func');

};
