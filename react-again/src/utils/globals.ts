import { LRUCache } from "lru-cache"
import { FsNode } from "./rust-fs-interface"

export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search

const LruOptions:LRUCache.Options<string,FsNode[],unknown>  = {
    max:50,
    allowStale: false,
}
export const searchCache:LRUCache<string,FsNode[]> = new LRUCache(LruOptions)
