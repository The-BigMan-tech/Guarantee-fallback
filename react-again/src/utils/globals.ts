import { FsNode } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { watchImmediate,WatchEvent,UnwatchFn } from "@tauri-apps/plugin-fs";
import { isCreate,isModify,isRemove } from "./watcher-utils";
import { info,debug,error,warn} from '@tauri-apps/plugin-log';


const shouldLogToFile:boolean = true;
const formatObjects:boolean = false;

export const memConsoleLog = console.log
export const memConsoleInfo = console.info
export const memConsoleWarn = console.warn
export const memConsoleError = console.error

export function modifyLogs() {
    function formatArgs(args:unknown[]) {
        return args.map(arg => {
            if ((typeof arg === 'string') || !(formatObjects)) {
                return arg
            }
            return JSON.stringify(arg,null,2)
        }).join(' ');
    }
    if (shouldLogToFile) {
        console.log = (...args) => {
            debug(formatArgs(args));
        };
        console.info = (...args) => {
            info(formatArgs(args));
        };
        console.warn = (...args) => {
            warn(formatArgs(args));
        };
        console.error = (...args) => {
            error(formatArgs(args));
        };
    }
}
export const heavyFolders:Readonly<Set<string>> = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search

export function isFolderHeavy(path:string):boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    for (const heavy of heavyFolders) {
        if (normalizedPath.endsWith(heavy)) {
            return true;
        }
    }
    return false
}
function terminateWatcher(key:string) {
    const stopFn = activeWatchers.get(key);// Stop and remove watcher for evicted key
    if (stopFn) {
        console.log("EVICTING THE WATCHER IN CACHE: ",key);
        stopFn();
        activeWatchers.delete(key);
    }
}
function shouldCacheEntry(key:string):boolean {
    if (isFolderHeavy(key)) {
        console.log(`Skipping resumable caching for heavy folder: ${key}`);
        return false
    }
    spawnSearchCacheWatcher(key)
    return true
}

type Query = string;
export interface RelevanceData {
    relevancePercent:number,
    shouldDefer:boolean
}
export type Queries = Record<Query,RelevanceData>

const maxCacheSize = 0;

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})

const maxPassiveCacheSize = 50
const passiveSearchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxPassiveCacheSize })
const passiveHeuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxPassiveCacheSize})

export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();

searchCache.onSet = (key) => {
    return shouldCacheEntry(key)
}
heuristicsCache.onSet = (key) => {
    return shouldCacheEntry(key)
}
searchCache.onEvict = (key,value) => {
    passiveSearchCache.set(key,value)
    terminateWatcher(key)
}
heuristicsCache.onEvict = (key,value) => {
    passiveHeuristicsCache.set(key,value)
    terminateWatcher(key)
}
searchCache.onGet = (key,value) => {
    if (value) {
        return value
    };
    memConsoleLog("Returning from passive search cache: ",key);
    return passiveSearchCache.get(key)
}
heuristicsCache.onGet = (key,value) => {
    if (value) {
        return value
    };
    memConsoleLog("Returning from passive heuristic cache: ",key);
    return passiveHeuristicsCache.get(key)
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