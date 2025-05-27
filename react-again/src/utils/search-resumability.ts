import { FsNode, FsResult, getMtime } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { watchImmediate,WatchEvent,UnwatchFn } from "@tauri-apps/plugin-fs";
import { isCreate,isModify,isRemove } from "./watcher-utils";
import { isFolderHeavy } from "./folder-utils";


export interface RelevanceData {
    relevancePercent:number,
    shouldDefer:boolean
}
interface PassiveCache<V> {
    data:V,
    mtime:Date
}
type Query = string;
export type Queries = Record<Query,RelevanceData>

const maxCacheSize = 200;
const maxPassiveCacheSize = 100
export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})

const passiveSearchCache:LifoCache<string,PassiveCache<FsNode[]>> = new LifoCache({ max:maxPassiveCacheSize })
const passiveHeuristicsCache:LifoCache<string,PassiveCache<Queries>> = new LifoCache({ max:maxPassiveCacheSize})


searchCache.onSet = (key) => {
    return shouldCacheEntry(key)
}
heuristicsCache.onSet = (key) => {
    return shouldCacheEntry(key)
}
searchCache.onEvict = async (key,value) => {
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);   
    if (!(mtimeResult.value instanceof Error)) {
        passiveSearchCache.set(key,{data:value,mtime:mtimeResult.value})
    }
    terminateWatcher(key)
}
heuristicsCache.onEvict = async (key,value) => {
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);   
    if (!(mtimeResult.value instanceof Error)) {
        passiveHeuristicsCache.set(key,{data:value,mtime:mtimeResult.value})
    }
    terminateWatcher(key)
}
searchCache.onGet = async (key,value) => {
    if (value) {
        return value
    };
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);
    if (!(mtimeResult.value instanceof Error)) {
        console.log("Checking passive search cache: ",key);
        const currentMtime = mtimeResult.value
        const passiveEntry = await passiveSearchCache.get(key);
        const isEntryValid = currentMtime.getTime()==passiveEntry?.mtime.getTime()
        console.log("Is Valid?: ",isEntryValid)
        if (isEntryValid) {
            return passiveEntry.data
        }else {
            passiveSearchCache.delete(key)//freeing up the passive entry cache
            return undefined
        }
    }
}
heuristicsCache.onGet = async (key,value) => {
    if (value) {
        return value
    };
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);
    if (!(mtimeResult.value instanceof Error)) {
        console.log("Checking passive heuristic cache: ",key);
        const currentMtime = mtimeResult.value
        const passiveEntry = await passiveHeuristicsCache.get(key)
        const isEntryValid = currentMtime.getTime()==passiveEntry?.mtime.getTime()
        console.log("Is Valid?: ",isEntryValid)
        if (isEntryValid) {
            return passiveEntry.data
        }else {
            passiveSearchCache.delete(key)
            return undefined
        }
    }
}
export async function spawnSearchCacheWatcher(path:string) {
    if (activeWatchers.has(path)) return; // Already watching
    if (activeWatchers.size >= MAX_WATCHERS) return//reached its max size and requires deletion of an evicted cache watcher
    if (isFolderHeavy(path)) return;//folder is too heavy to watch.keeps it in sync with the cache behaviour
    try {
        const stop = await watchImmediate(path,(event:WatchEvent)=>{
            if (isCreate(event.type) || isModify(event.type) || isRemove(event.type)) {
                searchCache.delete(path);
                heuristicsCache.delete(path);
                terminateWatcher(path)
            }
        },{recursive:false})
        activeWatchers.set(path,stop);
    }catch(err) {
        console.error(`Failed to watch path for search cache ${path}:`, err);
    }
}
function terminateWatcher(key:string) {
    const stopFn = activeWatchers.get(key);// Stop and remove watcher for evicted key
    if (stopFn) {
        console.log("TERMINATING THE WATCHER IN CACHE: ",key);
        stopFn();
        activeWatchers.delete(key);
    }
}
function shouldCacheEntry(key:string):boolean {
    if (isFolderHeavy(key)) {
        console.log(`Skipping resumable caching for heavy folder: ${key}`);
        return false
    }
    spawnSearchCacheWatcher(key)//im not suppose to await the watcher cuz it will lag indefinitely
    return true
}
