import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home,base_name} from '../utils/rust-fs-interface';
import {v4 as uniqueID} from 'uuid';


type JsonCache = {data:CachedFolder[]}
type CachingState = 'pending' | 'success';
type StrictTabsType = 'Recent' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos';
export type SortingOrder = 'name' | 'date' | 'type' | 'size';
export type View = 'xl' | 'l' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content';

export interface Message {
    id:string,
    message:string | null
}
export interface UniqueTab {
    id:string,
    name:string
}
export interface UniqueFsNode {
    id:string,
    fsNode:FsNode
}
interface CachedFolder {
    path:string,
    data:FsNode[]
}
export interface processingSliceState {//by using null unions instead of optional types,i ensure that my app doesnt accidenteally worked with an undefined value
    currentPath:string,//as breadcrumbs
    tabNames:string[],//home tabs
    fsNodes:FsNode[] | null,//current files loaded
    cache:CachedFolder[],
    aheadCachingState:CachingState
    selectedFsNodes:FsNode[] | null,//for selecting for deleting,copying or pasting
    error:Message//for writing app error
    notice:Message,//for writing app info
    loadingMessage:string | null//for loading messages
    searchQuery:string | null,//for storing the search query
    sortBy:SortingOrder,//sorting order of the files
    viewBy:View,//changes the layout of the folder content
    showDetailsPane:boolean//to show extra details like charts or disk usage
}


const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos'],//Home and recent are only local to sidebar cuz there is no dir named home and recent on the fs
    fsNodes:null,
    cache:[],
    aheadCachingState:'pending',
    selectedFsNodes:null,
    error:{id:"",message:null},//the ids is to ensure that the same error can pop up twice
    notice:{id:"",message:null},
    loadingMessage:null,//no id here because only one thing can be loaded at a time
    searchQuery:null,
    sortBy:'name',
    viewBy:'details',
    showDetailsPane:true
}


export const processingSlice = createSlice({
    name: 'processing',
    initialState,
    reducers: {
        setCurrentPath(state,action:PayloadAction<string>) {
            state.currentPath = action.payload
        },
        setFsNodes(state,action:PayloadAction<FsNode[] | null>) {
            state.fsNodes = action.payload
        },
        setCache(state,action:PayloadAction<CachedFolder[]>) {
            state.cache = action.payload
        },
        pushToFsNodes(state,action:PayloadAction<FsNode>) {
            state.fsNodes?.push(action.payload)
        },
        pushToCache(state,action:PayloadAction<CachedFolder>) {
            state.cache.push(action.payload)
        },
        replaceInCache(state,action:PayloadAction<{index:number,data:CachedFolder}>) {
            state.cache[action.payload.index] = action.payload.data
        },
        shiftCache(state) {
            state.cache.shift()
        },
        setAheadCachingState(state,action:PayloadAction<CachingState>) {
            state.aheadCachingState = action.payload
        },
        setError(state,action:PayloadAction<string>) {
            state.error.id = uniqueID();
            state.error.message = action.payload;
        },
        setNotice(state,action:PayloadAction<string>) {
            state.notice.id = uniqueID();
            state.notice.message = action.payload
        },
        setLoadingMessage(state,action:PayloadAction<string | null>) {
            state.loadingMessage = action.payload
        },
        setSearchQuery(state,action:PayloadAction<string>) {
            state.searchQuery = action.payload
        },
        setSortBy(state,action:PayloadAction<SortingOrder>) {
            state.sortBy = action.payload
        },
        setView(state,action:PayloadAction<View>) {
            state.viewBy = action.payload
        },
        setShowDetails(state,action:PayloadAction<boolean>) {
            state.showDetailsPane = action.payload
        }
    },
})


export const {
    setCurrentPath,
    setFsNodes,
    pushToFsNodes,
    setCache,
    pushToCache,
    replaceInCache,
    shiftCache,
    setAheadCachingState,
    setError,
    setNotice,
    setLoadingMessage,
    setSearchQuery,
    setSortBy,
    setView,
    setShowDetails
} = processingSlice.actions;


export default processingSlice.reducer;
export const selectCurrentPath = (store:RootState):string => store.processing.currentPath;
export const selectTabNames = (store:RootState):string[] => store.processing.tabNames;
export const selectFsNodes = (store:RootState):FsNode[] | null => store.processing.fsNodes;
export const selectSelectedFsNodes = (store:RootState):FsNode[] | null => store.processing.selectedFsNodes;
export const selectError = (store:RootState):Message => store.processing.error;
export const selectNotice = (store:RootState):Message => store.processing.notice;
export const selectLoadingMessage = (store:RootState):string | null => store.processing.loadingMessage;
export const selectSearchQuery = (store:RootState):string | null => store.processing.searchQuery;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;
export const selectAheadCachingState = (store:RootState):CachingState => store.processing.aheadCachingState;
const selectCache = (store:RootState):CachedFolder[] =>store.processing.cache || [];


export async function returnFileContent(filePath:string):Promise<AppThunk<Promise<string | null>>> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        const fileName = await base_name(filePath);
        dispatch(setLoadingMessage(`Loading the file: ${fileName}`))

        const contentResult:FsResult<string | Error | null>  = await readFile(filePath);
        if (contentResult.value instanceof Error) {
            dispatch(setError(`The error "${contentResult.value.message}" occured when reading the file: "${filePath}"`))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice(`The following file is empty: ${filePath}`))
            return null;
        }else {
            dispatch(setLoadingMessage(`Done loading: ${fileName}`));
            return contentResult.value
        }
    }
}
function getParent():AppThunk<string> {
    return (_,getState):string  =>{
        let currentPath:string = selectCurrentPath(getState());
        currentPath = currentPath.slice(0,currentPath.lastIndexOf('\\'));
        return currentPath
    }
}
function addToCache(data:CachedFolder):AppThunk {
    return (dispatch,getState)=>{
        console.log("Called add to cache");
        const appCache = selectCache(getState());
        const cachedPaths:string[] = appCache.map(folder=>folder.path);
        const existingCacheIndex = cachedPaths.indexOf(data.path);
        if (existingCacheIndex !== -1) {//if the cache already exists as -1 means it doesnt exist
            console.log(data.path,"Cache already exists at index",existingCacheIndex);
            dispatch(replaceInCache({index:existingCacheIndex,data}))
        }else {
            console.log("Caching the folder",data.path);
            if ((appCache.length+1) > 20) {
                console.log("Cache length is greater than 3");
                dispatch(shiftCache())
            }
            data.data.slice(0,101)//ensures that only a 100 fsnodes are stored in the cache
            dispatch(pushToCache(data))
        }
        console.log("Cache: ",appCache);
    }
}
function openCachedDirInApp(folderPath:string):AppThunk {
    return (dispatch,getState)=>{
        console.log("called open dir in app");
        const cache:CachedFolder[] = selectCache(getState());
        for (const cachedFolder of cache) {
            if (folderPath == cachedFolder.path) {
                dispatch(setFsNodes(cachedFolder.data))
            }
        }
    }
}
export async function cacheAheadOfTime(tabName:StrictTabsType,isLast:boolean):Promise<AppThunk>{
    return async (dispatch)=>{
        const folderPath = await join_with_home(tabName);
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath);
        if (!(dirResult.value instanceof Error) && (dirResult.value !== null)) {//i only care about the success case here because the operation was initiated by the app and not the user and its not required to succeed for the user to progress with the app
            const fsNodes:FsNode[] = await Promise.all(dirResult.value);
            dispatch(addToCache({path:folderPath,data:fsNodes}));
            if (isLast) {
                dispatch(setAheadCachingState('success'))
            }
        }
    }
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch,getState):Promise<void> =>{
        console.log("Folder path for cached",folderPath);
        //[] array means its loading not that its empty
        dispatch(setFsNodes([]))//ensures that clicking on another tab wont show the previous one while loading to not look laggy
        dispatch(openCachedDirInApp(folderPath));//opens the cached dir in app in the meantime if any
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.

        let folderName = await base_name(folderPath);
        folderName = (folderName=="USER")?"Home":folderName;
        dispatch(setLoadingMessage(`Loading the folder: ${folderName}`))
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath);//its fast because it doesnt load the file content

        if (dirResult.value instanceof Error) {
            dispatch(setFsNodes(null))//to ensure that they dont interact with an unstable folder in the ui
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`));
        }else if (dirResult.value == null) {
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
            dispatch(setFsNodes(null))//null fs nodes then means its empty
        }else {
            const aotCachingState = selectAheadCachingState(getState())
            let fsNodes:FsNode[] = []
            if ((folderName === "Home") && (aotCachingState === "pending")) {//for user experience
                for (const fsNodePromise of dirResult.value) {
                    const fsNode:FsNode = await fsNodePromise;
                    dispatch(pushToFsNodes(fsNode))
                }
                fsNodes = selectFsNodes(getState()) || []//fsnodes cant be null here because a series of fsnodes were already pushed above this line but the ts compiler cant infer that so i just provided a fallback value
            }else {
                fsNodes = await Promise.all(dirResult.value);
                dispatch(setFsNodes(fsNodes))
            }
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            //since the ui remains frozen as its caching ahead of time,there is no need to add a debouncing mechanism to prevent the user from switching to another tab while its caching
            dispatch(addToCache({path:folderPath,data:fsNodes}));//performs caching while the user can interact with the dir in the app
            console.log("Files:",fsNodes);
        }
        //just ignore this.ive chosen to accept it
        // dispatch(setLoadingMessage(null))//to clear the loading message so that the unfreeze state resets back to false after an operation has finished loaded
    }
}
export async function openParentInApp():Promise<AppThunk> {
    return async (dispatch)=>{
        const parentPathResult:string = await dispatch(getParent());
        dispatch(await openDirectoryInApp(parentPathResult))
    }
}
export async function openDirFromHome(tabName:string):Promise<AppThunk> {
    return async (dispatch)=> {
        const folderPath:string = await join_with_home(tabName)
        dispatch(await openDirectoryInApp(folderPath))
    }
}
export function loadCache():AppThunk {
    return (dispatch) => {
        const fallback:string = JSON.stringify({data:[]})
        const cache_as_string:string = localStorage.getItem("appCache") || fallback;
        const cache:JsonCache = JSON.parse(cache_as_string);
        console.log("Deserialized cache",cache.data);
        dispatch(setCache(cache.data))
    }
}
function storeCache():AppThunk {
    return (_,getState)=>{
        localStorage.clear();//to clean the local storage before storing the cache
        const cache:CachedFolder[] = selectCache(getState());
        const json_cache:JsonCache = {data:cache}
        localStorage.setItem("appCache",JSON.stringify(json_cache))
    }
}
