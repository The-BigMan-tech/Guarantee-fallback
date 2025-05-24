import { LRUCache } from "lru-cache"
import { FsNode } from "./rust-fs-interface"

export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search

const SearchLruOptions:LRUCache.Options<string,FsNode[],unknown>  = {
    max:200,
    allowStale: false,
}
export const searchCache:LRUCache<string,FsNode[]> = new LRUCache(SearchLruOptions)

type Query = string;
type ShouldDefer = boolean;

export type Queries = Record<Query,ShouldDefer>

const HeuristicsLruOptions:LRUCache.Options<string,Queries,unknown> = {
    max:200,
    allowStale:false,
    onInsert:(value,key)=>{
        console.log(`HEURISTICS KEY: ${key} QUERY RECORDS: ${value}`);
    }
}
export const heuristicsCache:LRUCache<string,Queries,unknown> = new LRUCache(HeuristicsLruOptions)