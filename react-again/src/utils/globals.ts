import { FsNode } from "./rust-fs-interface"
import { LifoCache } from "./lifo-cache";

export const heavyFolders = new Set(['node_modules','AppData','.git','src-tauri/target/debug'])//this will do for now.i will add more later on monitoring the search
const cacheMaxSize = 200;

type Query = string;
type ShouldDefer = boolean;
export type Queries = Record<Query,ShouldDefer>

export const searchCache:LifoCache<string,FsNode[]> = new LifoCache({ max: cacheMaxSize })
export const heuristicsCache:LifoCache<string,Queries> = new LifoCache({ max: cacheMaxSize })

// onInsert:(value,key)=>{
//     console.log(`HEURISTICS KEY: ${key} QUERY RECORDS: ${JSON.stringify(value,null,2)}`);
// }