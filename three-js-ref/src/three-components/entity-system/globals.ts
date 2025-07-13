import {v4 as uniqueID} from "uuid";

export const groupIDs = {//i intended to define this in the entity manager but i couldnt do so without running into cyclic imports
    player:uniqueID(),
    hostileEntity:uniqueID(),
    npc:uniqueID()
}
export type EntityWrapper = 'HostileEntity' | 'NPC'

export function isEntityWrapper(name:string): name is EntityWrapper {
    return name === 'HostileEntity' || name === 'NPC';
}

interface CountData {
    currentCount:number,
    minCount:number
}
export interface EntityCount {
    totalCount:number,
    individualCounts:Record<EntityWrapper,CountData>
}
