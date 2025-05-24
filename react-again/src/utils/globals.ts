import { LRUCache } from 'lru-cache';
import { FsNode } from './rust-fs-interface';
export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search


type NodePath = string;
type Query = string;
type IndexQueue = number[];

interface SearchData {
    queries:LRUCache<Query,IndexQueue>,
    dirCache:FsNode[]
}
type HeuristicCache = LRUCache<NodePath,SearchData>;

export const QueryLruOptions:LRUCache.Options<Query,IndexQueue,unknown>  = {//multiple query lrus per path
    max:30,
    allowStale: false,
}
const HeurisicLruOptions:LRUCache.Options<NodePath,SearchData,unknown> = {
    max:400,
    allowStale: false,
}
export const searchCache:HeuristicCache = new LRUCache(HeurisicLruOptions)//only one heuristic cache