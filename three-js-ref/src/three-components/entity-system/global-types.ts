import type { ItemID } from "../item-system/behaviour/core/types";

export type EntityWrapper = 'HostileEntity' | 'NPC'

interface CountData {
    currentCount:number,
    minCount:number
}
export interface EntityCount {
    totalCount:number,
    individualCounts:Record<EntityWrapper,CountData>
}

export interface EntitySpawnData {
    readonly groupID:Readonly<string>,
    readonly spawnWeight:Readonly<number>
}
export type seconds = number;
export type minutes = number;
export type degrees = number;

export type ItemUsageWeight = number;

export type EntityItems = Record<ItemID,ItemUsageWeight>