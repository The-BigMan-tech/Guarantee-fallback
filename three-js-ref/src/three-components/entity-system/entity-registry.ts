import {v4 as uniqueID} from "uuid";
import type { EntityWrapper } from "./global-types";
import type { EntitySpawnData,EntityCount } from "./global-types";

const debug:boolean = false;

export const groupIDs = {//i intended to define this in the entity manager but i couldnt do so without running into cyclic imports
    player:(debug)?'player':uniqueID(),
    hostileEntity:(debug)?'hostile entity':uniqueID(),
    npc:(debug)?'npc':uniqueID()
}
export function isEntityWrapper(name:string): name is EntityWrapper {
    return name === 'HostileEntity' || name === 'NPC';
}
export const entityCounts:EntityCount =  {
    totalCount:0,
    individualCounts: {
        HostileEntity:{currentCount:0,minCount:1},//the min count influences how many entities of this kind should be in the world before the manager is satisfied to stop spawning more entities.a higher number means that it will attempt to spawn new entities more and more until this thresh is satisfied but its capped at max entity cap for perf to prevent too many attempts
        NPC:{currentCount:0,minCount:1},
    }
}
export const entityMapping:Record<EntityWrapper,EntitySpawnData> = {
    HostileEntity:{
        groupID:groupIDs.hostileEntity,//i called it groupID cuz its not per isntance but per entity type or kind
        spawnWeight:10//an important thing to note is that when the weight is 0 but at least one of the others is non-zero,then this entity will never have the chance to be pciked but if all the other entities are non-zero,its the same thing as all of them having 10 or 100 cuz the weights are equal.thats the thing about weighted random.is the probabliliy of picking one relative to the probability of others not absolute probability.so to totally remove entities,set entity cap to 0.
    },
    NPC: {
        groupID:groupIDs.npc,
        spawnWeight:0
    }
}