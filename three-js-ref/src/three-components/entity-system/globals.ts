import {v4 as uniqueID} from "uuid";

const debug:boolean = true;

export const groupIDs = {//i intended to define this in the entity manager but i couldnt do so without running into cyclic imports
    player:(debug)?'player':uniqueID(),
    hostileEntity:(debug)?'hostile entity':uniqueID(),
    npc:(debug)?'npc':uniqueID()
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
