//@ts-expect-error :I intetionally didnt install the type files because they were misleading the compiler about how to call the throttle function which was falsely flagging my code
import {throttle} from 'throttle-debounce';
import { CachePayload,Cache,HomeTabsToValidate,HomeTab,TabCacheInvalidation} from "../types";
import { AppThunk,AppDispatch} from "../store";
import { isFolderHeavy } from '../../utils/folder-utils';
import { selectCache ,selectIvalidatedTabs} from "../selectors";
import { shiftCache,recordInCache,validateTabCache,setFsNodes,setCache} from "../slice";
import { FsNode, join_with_home} from "../../utils/rust-fs-interface";
import { searchCache } from '../../utils/search-resumability';
import { memConsoleLog } from '../../utils/log-config';


export function addToCache(arg:CachePayload,folderName:string):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("Called add to cache");
        if (await searchCache.get(arg.path)) {//if its in the search cache,use it from there instead of wasting memory to create a new one and disk space to persist it but it also means that this visited dir,wont persist across sessions
            return 
        }
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
        //todo:this check is fragile as other paths can have their basenames end with home tab names.fix later
        if (!isHomeTab(folderName)) {//bound the number of fsnodes per record in the cache if it isnt a home tab as unlike the home tab,they are always invalidated on reopen but they are displayed in the ui frozen in the meantime
            dirNodes = arg.data.slice(0,Math.min(100,dirNodes.length))
        }
        dispatch(recordInCache({path:arg.path,data:dirNodes}))
        if (isHomeTabToValidate(folderName)) {//validates the cache because its up to date
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
        dispatch(setFsNodes(cached_data));
    }
}
export function cacheIsValid(folderPath:string):AppThunk<Promise<boolean>> {
    return async (_,getState) =>{
        if (await searchCache.get(folderPath)) {//the search cache is monitored by my the resumability component of my search engine for staleness so if its present,it isnt stale.
            return true
        }
        const homePath = await join_with_home('');
        const nameSlice = folderPath.slice(homePath.length+1) || 'Home'//the slice will be empty if its in the home folder because its only the home folder path that will slice out the entire string so this is correct
        memConsoleLog("Name slice: ",nameSlice)
        const invalidatedTabs:TabCacheInvalidation = selectIvalidatedTabs(getState());
        console.log("Invalidated tabs",invalidatedTabs);
        if ((isHomeTabToValidate(nameSlice)) && (invalidatedTabs[nameSlice] == false)) {//if it isnt invalidated,load the ui immediately
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
function isHomeTabToValidate(folderName:string):folderName is HomeTabsToValidate  {
    return (folderName=="Home") || (folderName=="Desktop")  || (folderName=="Downloads") || (folderName=="Documents") || (folderName=="Pictures") || (folderName=="Music") || (folderName=="Videos")
}
function isHomeTab(folderName:string):folderName is HomeTab  {
    return isHomeTabToValidate(folderName) || (folderName=='Recent')
}