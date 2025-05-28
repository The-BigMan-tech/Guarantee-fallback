import { FsNode, FsResult, getMtime } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { watchImmediate,WatchEvent,UnwatchFn } from "@tauri-apps/plugin-fs";
import { isFileEvent } from "./watcher-utils";
import { isFolderHeavy } from "./folder-utils";
import { memConsoleLog } from "./log-config";


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
const maxPassiveCacheSize = 100;

export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})

const passiveSearchCache:LifoCache<string,PassiveCache<FsNode[]>> = new LifoCache({ max:maxPassiveCacheSize })
const passiveHeuristicsCache:LifoCache<string,PassiveCache<Queries>> = new LifoCache({ max:maxPassiveCacheSize})

async function setPassiveEntry<T>(key:string,value:T,passiveCache:LifoCache<string,PassiveCache<T>>) {
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);   
    if (!(mtimeResult.value instanceof Error)) {
        passiveCache.set(key,{data:value,mtime:mtimeResult.value})
    }
}
async function getPassiveEntry<T>(key:string,passiveCache:LifoCache<string,PassiveCache<T>>):Promise<T | undefined> {
    const mtimeResult:FsResult<Date | Error> = await getMtime(key);
    if (!(mtimeResult.value instanceof Error)) {
        memConsoleLog("Checking passive search cache: ",key);
        const currentMtime = mtimeResult.value
        const passiveEntry = await passiveCache.get(key);
        const isEntryValid = currentMtime.getTime()==passiveEntry?.mtime.getTime()
        memConsoleLog("Is Valid?: ",isEntryValid)
        if (isEntryValid) {
            return passiveEntry.data
        }else {
            passiveCache.delete(key)//freeing up the passive entry cache
            return undefined
        }
    }
}
searchCache.onSet = async (key,value) => {
    return await shouldCacheEntry<FsNode[]>(key,value,passiveSearchCache)
}
heuristicsCache.onSet = async (key,value) => {
    return await shouldCacheEntry<Queries>(key,value,passiveHeuristicsCache)
}
searchCache.onEvict = async (key,value) => {
    await setPassiveEntry<FsNode[]>(key,value,passiveSearchCache)
    terminateWatcher(key)
}
heuristicsCache.onEvict = async (key,value) => {
    await setPassiveEntry<Queries>(key,value,passiveHeuristicsCache)
    terminateWatcher(key)
}
searchCache.onGet = async (key,value) => {
    if (value) return value;
    return await getPassiveEntry<FsNode[]>(key,passiveSearchCache)
}
heuristicsCache.onGet = async (key,value) => {
    if (value) return value;
    return await getPassiveEntry<Queries>(key,passiveHeuristicsCache)
}
export async function spawnSearchCacheWatcher<T>(path:string,value:T,passiveCache:LifoCache<string,PassiveCache<T>>) {
    if (activeWatchers.has(path)) return; // Already watching
    if (activeWatchers.size >= MAX_WATCHERS) return//reached its max size and requires deletion of an evicted cache watcher
    if (isFolderHeavy(path)) return;//folder is too heavy to watch.keeps it in sync with the cache behaviour
    try {
        const stop = await watchImmediate(path,
            (event:WatchEvent)=>{
                if (isFileEvent(event.type)) {
                    deleteEntry(path)
                    terminateWatcher(path)
                }
            }
        ,{recursive:false});
        activeWatchers.set(path,stop);
    }catch {
        memConsoleLog(`Watcher failed for path:${path}.falling back to passive cache`);
        deleteEntry(path)
        await setPassiveEntry<T>(path,value,passiveCache);
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
async function shouldCacheEntry<T>(key:string,value:T,passiveCache:LifoCache<string,PassiveCache<T>>):Promise<boolean> {
    if (isFolderHeavy(key)) {
        console.log(`Skipping resumable caching for heavy folder: ${key}`);
        return false
    }
    spawnSearchCacheWatcher(key,value,passiveCache)//im not suppose to await the watcher cuz it will lag indefinitely
    return true
}
function deleteEntry(path:string) {
    searchCache.delete(path);
    heuristicsCache.delete(path);
}
