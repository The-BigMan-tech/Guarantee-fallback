import { AppThunk } from "../store";
import { FsNode,base_name,readDirectory,FsResult,join_with_home} from "../../utils/rust-fs-interface";
import { setFsNodes,setCurrentPath,setOpenedFile,setSearchResults,setError,setNotice,invalidateTabCache, setIsDisplayingCache, setFreezeBars, setFreezeNodes} from "../slice";
import { selectCurrentPath,selectCache} from "../selectors";
import { WatchEvent,watchImmediate,BaseDirectory} from "@tauri-apps/plugin-fs";
import { isFileEvent} from "../../utils/watcher-utils";
import { HomeTabsToValidate,HomeTab,Cache} from "../types";
import {toast} from "react-toastify"
//*Thunk dependency
import { openCachedDirInApp,cacheIsValid,addToCache} from "./ui-cache-related";
import { loading_toastConfig } from "../../utils/toast-configs";

function updateUI(value:(Promise<FsNode>)[]):AppThunk<Promise<FsNode[]>> {
    return async (dispatch):Promise<FsNode[]> => {
        const localFsNodes = await Promise.all(value);
        dispatch(setFsNodes(localFsNodes));
        dispatch(setIsDisplayingCache(false))
        return localFsNodes;
    }   
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export function openDirectoryInApp(folderPath:string):AppThunk<Promise<void>> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        console.log("Folder path for cached",folderPath);  
        const folderName:string = await base_name(folderPath,true);

        // dispatch(setFsNodes([]))
        if (!dispatch(cacheIsValid(folderName))) {//i used this condition so that i can control the ui using display cache when showing an invalidated cache
            await dispatch(openCachedDirInApp(folderPath));
            dispatch(setIsDisplayingCache(true));
        }
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.
        dispatch(setOpenedFile(null))
        dispatch(setSearchResults(null))//to clear search 
        
        toast.loading(`Loading the folder: ${folderName}`,loading_toastConfig)
        dispatch(setFreezeNodes(true))

        if (dispatch(cacheIsValid(folderName))) {//a validated cache should not say its displaying the cache cuz it will cause the ui to flicker between slicing and a full fsnodes
            console.log("CACHE IS VALID");
            await dispatch(openCachedDirInApp(folderPath));

            toast.dismiss()
            toast.loading(`Done loading: ${folderName}`,loading_toastConfig)
            dispatch(setFreezeNodes(false))
            
            return
        }
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath,'arbitrary');//its fast because it doesnt load the file content
        if (dirResult.value instanceof Error) {
            dispatch(setFsNodes(null))//to ensure that they dont interact with an unstable folder in the ui
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`));
        }else if (dirResult.value == null) {
            toast.loading(`Done loading: ${folderName}`,loading_toastConfig)
            dispatch(setFreezeNodes(false))

            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
            dispatch(setFsNodes(null))//null fs nodes then means its empty
        }else {
            let fsNodes:FsNode[] = []//used to batch fsnodes for ui updates
            fsNodes = await dispatch(updateUI(dirResult.value));

            toast.dismiss()
            toast.loading(`Done loading: ${folderName}`,loading_toastConfig)
            dispatch(setFreezeNodes(false))

            dispatch(addToCache({path:folderPath,data:fsNodes},folderName));//performs caching while the user can interact with the dir in the app./since the ui remains frozen as its caching ahead of time,there is no need to add a debouncing mechanism to prevent the user from switching to another tab while its caching
            console.log("Files:",fsNodes);
        }
        //just ignore this.ive chosen to accept it
        // dispatch(setLoadingMessage(null))//to clear the loading message so that the unfreeze state resets back to false after an operation has finished loaded
    }
}
export function openParentInApp():AppThunk<Promise<void>> {
    return async (dispatch)=>{
        const parentPathResult:string = dispatch(getParent());
        await dispatch(openDirectoryInApp(parentPathResult))
    }
}
export function openDirFromHome(tabName:string):AppThunk<Promise<void>> {
    return async (dispatch)=> {
        const folderPath:string = await join_with_home(tabName)
        await dispatch(openDirectoryInApp(folderPath))
    }
}
function getParent():AppThunk<string> {
    return (_,getState):string  =>{
        let currentPath:string = selectCurrentPath(getState());
        currentPath = currentPath.slice(0,currentPath.lastIndexOf('\\'));
        console.log("PARENT PATH: ",currentPath);
        return currentPath
    }
}
export function watchHomeTabs():AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("CALLED FILE WATCHER");
        dispatch(setFsNodes([]))
        // dispatch(setFreezeNodes(true))
        await watchImmediate(
            [
                await join_with_home("Home"),//for home
                await join_with_home("Desktop"),
                await join_with_home("Downloads"),
                await join_with_home("Documents"),
                await join_with_home("Pictures"),
                await join_with_home("Music"),
                await join_with_home("Videos"),
            ],
            async (event:WatchEvent) => {
                console.log('Logged directory event');
                if (isFileEvent(event.type)) {
                    console.log("Logged modification",event);
                    const currentPath = selectCurrentPath(getState());
                    const triggeredPaths = event.paths;
                    for (const path of triggeredPaths) {
                        const parent = path.slice(0,path.lastIndexOf('\\'));
                        const tabName:HomeTabsToValidate = await base_name(parent,true) as HomeTabsToValidate;
                        dispatch(invalidateTabCache({tabName}));    
                        const currentPathBase = await base_name(currentPath,false)
                        if (currentPathBase == tabName) {//auto reload if the tab is currently opened
                            await dispatch(openDirFromHome(tabName))
                        }else {//auto reload the tab in the background ahead of time.reloading it in the background is very fast because if no ui updates
                            toast.loading("Refreshing the app in the background.",loading_toastConfig)
                            dispatch(setFreezeNodes(true))
                            await dispatch(cacheHomeTab(tabName,false));
                        }
                    }
                }
            },
            {
                baseDir: BaseDirectory.Home,
                recursive:false
            }
        )
    }
}
export function cacheHomeTab(tabName:HomeTab,reuseEntry:boolean):AppThunk<Promise<void>>{
    return async (dispatch,getState)=>{
        dispatch(setFreezeBars(true))
        const folderPath = await join_with_home(tabName);
        const cache:Cache = selectCache(getState());
        if (cache[folderPath] && reuseEntry) return;
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath,'arbitrary');
        if (!(dirResult.value instanceof Error) && (dirResult.value !== null)) {//i only care about the success case here because the operation was initiated by the app and not the user and its not required to succeed for the user to progress with the app
            const fsNodes:FsNode[] = await Promise.all(dirResult.value);
            dispatch(addToCache({path:folderPath,data:fsNodes},tabName));
            dispatch(setFreezeBars(false))
        }
    }
}