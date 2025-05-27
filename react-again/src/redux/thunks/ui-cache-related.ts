//@ts-expect-error :I intetionally didnt install the type files because they were misleading the compiler about how to call the throttle function which was falsely flagging my code
import {throttle} from 'throttle-debounce';
import { CachePayload,Cache,AllTabTypes,TabCacheInvalidation} from "../types";
import { AppThunk,AppDispatch} from "../store";
import { isFolderHeavy } from "../../utils/globals";
import { selectCache ,selectIvalidatedTabs} from "../selectors";
import { shiftCache,recordInCache,validateTabCache,setFsNodes,spreadToFsNodes,setCache,setLoadingMessage} from "../slice";
import { FsNode} from "../../utils/rust-fs-interface";
import { searchCache } from '../../utils/globals';


export function addToCache(arg:CachePayload,folderName:string):AppThunk {
    return (dispatch,getState)=>{
        console.log("Called add to cache");
        if (isFolderHeavy(arg.path)) {
            console.log("Refused to cache heavy folder: ",arg.path);
            return
        }
        const appCache:Cache = selectCache(getState());
        if (Object.keys(appCache).length >= 50) {//evict an item from the cache once it reaches 20
            console.log("Cache length is greater than 50");
            dispatch(shiftCache())
        }
        let dirNodes:FsNode[] = arg.data;
        if (!isAHomeTab(folderName)) {//bound the number of fsnodes per record in the cache if it isnt a home tab as unlike the home tab,they are always invalidated on reopen but they are displayed in the ui frozen in the meantime
            dirNodes = arg.data.slice(0,Math.min(100,dirNodes.length))
        }
        dispatch(recordInCache({path:arg.path,data:dirNodes}))
        if (isAHomeTab(folderName)) {//validates the cache because its up to date
            console.log("Validated the cache",folderName);
            dispatch(validateTabCache({tabName:folderName}))//since the cache was just updated,it makes sense to validate it.Its the only point where its validated
        }
        throttledStoreCache(dispatch);
    }
}
export function openCachedDirInApp(folderPath:string):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("called open dir in app");
        const cache:Cache = selectCache(getState());
        const cached_data = cache[folderPath] || await searchCache.get(folderPath) || [];//  [] array means its loading not that its empty
        console.log("Cached data in open",cached_data);
        const cache_length = cached_data.length;
        const slice_number = 10
        if (cache_length < slice_number) {
            dispatch(setFsNodes(cached_data));
            return
        }else {
            dispatch(setFsNodes(cached_data.slice(0,slice_number)));
            await new Promise((resolve) => queueMicrotask(() => resolve(undefined)))
            dispatch(spreadToFsNodes(cached_data.slice(slice_number, cache_length)));
            return
        }
    }
}
export function cacheIsValid(folderName:string):AppThunk<boolean> {
    return (dispatch,getState):boolean=>{
        const invalidatedTabs:TabCacheInvalidation = selectIvalidatedTabs(getState());
        console.log("Invalidated tabs",invalidatedTabs);
        if ((isAHomeTab(folderName)) && (invalidatedTabs[folderName] == false)) {//if it isnt invalidated,load the ui immediately
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            return true
        }
        return false
    }
}
export function loadCache():AppThunk {
    return (dispatch) => {
        const fallback:string = JSON.stringify({})
        const cache_as_string:string = localStorage.getItem("appCache") || fallback;
        const cache:Cache = JSON.parse(cache_as_string);
        console.log("Deserialized cache",cache);
        dispatch(setCache(cache))
    }
}
function storeCache():AppThunk {
    return (_,getState)=>{
        const cache:Cache = selectCache(getState());
        const stringifiedCache = JSON.stringify(cache)
        localStorage.setItem("appCache",stringifiedCache)
        console.log("STORE CACHE WAS CALLED",cache);
    }
}
const throttledStoreCache:throttle<()=>AppThunk> = throttle(5000,
    (dispatch:AppDispatch)=>(dispatch(storeCache())),
    {noLeading:true, noTrailing: false,}
);
function isAHomeTab(folderName:string):folderName is AllTabTypes  {
    return (folderName=="Home") || (folderName=="Desktop")  || (folderName=="Downloads") || (folderName=="Documents") || (folderName=="Pictures") || (folderName=="Music") || (folderName=="Videos")
}