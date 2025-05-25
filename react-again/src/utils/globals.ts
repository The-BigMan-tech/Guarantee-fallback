import { FsNode } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { watchImmediate,WatchEvent,UnwatchFn } from "@tauri-apps/plugin-fs";
import { isCreate,isModify,isRemove } from "./watcher-utils";

export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search

export function isFolderHeavy(path:string):boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    for (const heavy of heavyFolders) {
        if (normalizedPath.endsWith(heavy)) {
            return true;
        }
    }
    return false
}
type Query = string;
type ShouldDefer = boolean;
export type Queries = Record<Query,ShouldDefer>

const maxCacheSize = 200;

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})
export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();


searchCache.onSet = (key) => {
    if (isFolderHeavy(key)) {
        console.log(`Skipping search caching for heavy folder: ${key}`);
        return false
    }
}
heuristicsCache.onSet = (key) => {
    if (isFolderHeavy(key)) {
        console.log(`Skipping heuristics caching for heavy folder: ${key}`);
        return false
    }
}
searchCache.onEvict = (key) => {
    const stopFn = activeWatchers.get(key);// Stop and remove watcher for evicted key
    if (stopFn) {
        console.log("EVICTING THE WATCHER IN CACHE: ",key);
        stopFn();
        activeWatchers.delete(key);
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
                const stopFn = activeWatchers.get(path);
                if (stopFn) {
                    console.log('INVALIDATING THE SEARCH KEY IN CACHE: ',path);
                    stopFn();              // Stop watching
                    activeWatchers.delete(path); // Remove from active watchers
                }
            }
        },{recursive:false})
        activeWatchers.set(path,stop);
    }catch(err) {
        console.error(`Failed to watch path for search cache ${path}:`, err);
    }
}