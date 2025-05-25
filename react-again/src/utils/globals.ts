import { FsNode } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";
import { UnwatchFn } from "@tauri-apps/plugin-fs";

export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search

type Query = string;
type ShouldDefer = boolean;
export type Queries = Record<Query,ShouldDefer>

const maxCacheSize = 200;

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max:maxCacheSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max:maxCacheSize})
export const MAX_WATCHERS = maxCacheSize;
export const activeWatchers = new Map<string,UnwatchFn>();

searchCache.onEvict = (key) => {
    const stopFn = activeWatchers.get(key);// Stop and remove watcher for evicted key
    if (stopFn) {
        stopFn();
        activeWatchers.delete(key);
    }
}
// onInsert:(value,key)=>{
//     console.log(`HEURISTICS KEY: ${key} QUERY RECORDS: ${JSON.stringify(value,null,2)}`);
// }