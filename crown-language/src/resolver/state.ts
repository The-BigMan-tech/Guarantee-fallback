import { createKey, breakIntoLines } from "../utils/utils.js";
import { Safe } from "./phase-manager.js";


export interface ResolutionState {
    srcKeysAsSet:Safe<Set<string>>,
    updateSrcKeys:(srcText:string)=>void,
};

export const store:ResolutionState = {
    srcKeysAsSet:new Safe(new Set(),(ref)=>ref.value.clear()),

    updateSrcKeys:(srcText):void => {
        const manager = store.srcKeysAsSet.manager;
        manager.protect(['write','update'],(ref)=>{
            const srcLines = breakIntoLines(srcText);
            ref.value = new Set(srcLines.map((content,line)=>createKey(line,content as string)));
        });
    }
};
