import { FsNode, FsResult, getMtime} from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { watchImmediate,WatchEvent,UnwatchFn } from "@tauri-apps/plugin-fs";
import { isFileEvent } from "./watcher-utils";
import { isFolderHeavy } from "./folder-utils";
import { memConsoleLog } from "./log-config";
import { deleteDB, deleteItem, getItem, setItem, setupDatabase} from "./index-db";

await deleteDB();//im deleting the database to retain the integrity of all resumability data since many are in-memory,and only overflows go to the disk,all resumability data on the disk is cleared upon entry.it also prevents unbounded growth over time
await setupDatabase();

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

interface DiskCache {
    heuristicsCache:PassiveCache<Queries>,
    searchCache:PassiveCache<FsNode[]>
}
const maxCacheSize = 0;
const maxPassiveCacheSize = 0;

export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})

const passiveSearchCache:LifoCache<string,PassiveCache<FsNode[]>> = new LifoCache({ max:maxPassiveCacheSize })
const passiveHeuristicsCache:LifoCache<string,PassiveCache<Queries>> = new LifoCache({ max:maxPassiveCacheSize})

const mockHeuristics:PassiveCache<Queries> = {data:{},mtime:new Date()};
const mockSearchData:PassiveCache<FsNode[]> = {data:[],mtime:new Date()};

//todo:set a cap on the disk usage to prevent unbounded growth

passiveSearchCache.onEvict = async (key,value) => {
    const item = {heuristicsCache:mockHeuristics,searchCache:value}//the mock heuristics is used here because the search cache is used for a particular path in my search engine before using the heuritic cache on the same path.the mock data is just there to fill in the data.it will be merged with later
    await setItem<DiskCache>(key,item)
}
passiveHeuristicsCache.onEvict = async (key,value) => {
    const existingItem = await getItem<DiskCache>(key)//the heuristics cache is used in my search engine after the search cache so this is valid and no need for mock data but it should instead merge with the existing one
    const searchCache = existingItem?.searchCache || mockSearchData//the mock data fallback is used to let ts know that what im doing is valid
    const item = {searchCache,heuristicsCache:value}
    await setItem<DiskCache>(key,item)
}

passiveSearchCache.onGet = async (key,value)=> {
    if (value) return value;
    const item = await getItem<DiskCache>(key)
    return item?.searchCache
}
passiveHeuristicsCache.onGet = async (key,value)=> {
    if (value) return value;
    const item = await getItem<DiskCache>(key);
    return item?.heuristicsCache;
}

searchCache.onSet = (key,value) => {
    return shouldCacheEntry<FsNode[]>(key,value,passiveSearchCache)
}
heuristicsCache.onSet = (key,value) => {
    return shouldCacheEntry<Queries>(key,value,passiveHeuristicsCache)
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
function shouldCacheEntry<T>(key:string,value:T,passiveCache:LifoCache<string,PassiveCache<T>>):boolean {
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
            await deleteItem(key)//delete it from the database as well if present
            return undefined
        }
    }
}
