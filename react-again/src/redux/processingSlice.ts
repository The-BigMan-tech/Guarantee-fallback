//@ts-expect-error :I intetionally didnt install the type files because they were misleading the compiler about how to call the throttle function which was falsely flagging my code
import {throttle} from 'throttle-debounce';
import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home,base_name} from '../utils/rust-fs-interface';
import {v4 as uniqueID} from 'uuid';
import { AppDispatch } from './store';
import { watchImmediate, BaseDirectory, WatchEvent, WatchEventKind, WatchEventKindCreate, WatchEventKindModify, WatchEventKindRemove } from '@tauri-apps/plugin-fs';

type JsonCache = {data:CachedFolder[]}
type CachingState = 'pending' | 'success';
type StrictTabsType = 'Recent' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos';
type AllTabTypes = 'Home' | 'Recent' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos'
type  invalidationData = {tabName:AllTabTypes}
interface  TabCacheInvalidation {
    Home:boolean,
    Recent:boolean,
    Desktop:boolean,
    Downloads:boolean,
    Documents:boolean,
    Pictures:boolean,
    Music:boolean,
    Videos:boolean
}
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
    aheadCachingState:CachingState,
    invalidatedTabCache:TabCacheInvalidation,
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
    invalidatedTabCache:{Home:true,Recent:true,Desktop:true,Downloads:true,Documents:true,Pictures:true,Music:true,Videos:true},
    selectedFsNodes:null,
    error:{id:"",message:null},//the ids is to ensure that the same error can pop up twice
    notice:{id:"",message:null},
    loadingMessage:"loading",//no id here because only one thing can be loaded at a time
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
        spreadToFsNodes(state,action:PayloadAction<FsNode[]>) {
            state.fsNodes = [...(state.fsNodes || []),...action.payload]
        },
        pushToCache(state,action:PayloadAction<CachedFolder>) {
            state.cache.push(action.payload)
        },
        replaceInCache(state,action:PayloadAction<{index:number,data:CachedFolder}>) {
            state.cache[action.payload.index] = action.payload.data
        },
        shiftCache(state) {
            state.cache.splice(8,1)//its the same effect as shifting but it does this starting from index 8 so that the ones that are cached ahead of time will be preserved on the cache threshold
        },
        setAheadCachingState(state,action:PayloadAction<CachingState>) {
            state.aheadCachingState = action.payload
        },
        invalidateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = true
            console.log("Invalidated the tab",state.invalidatedTabCache[action.payload.tabName]);
        },
        validateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = false
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
    spreadToFsNodes,
    setCache,
    pushToCache,
    replaceInCache,
    shiftCache,
    setAheadCachingState,
    invalidateTabCache,
    validateTabCache,
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
export const selectCache = (store:RootState):CachedFolder[] =>store.processing.cache || [];
const selectIvalidatedTabs = (store:RootState):TabCacheInvalidation=>store.processing.invalidatedTabCache


export async function returnFileContent(filePath:string):Promise<AppThunk<Promise<string | null>>> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        const fileName = await base_name(filePath,false);
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
function addToCache(data:CachedFolder,tabName:string):AppThunk {
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
            //i have to remove the slicing because the cache needs to be complete if its going to be validated for ui interactions
            // data.data.slice(0,101)//ensures that only a 100 fsnodes are stored in the cache
            dispatch(pushToCache(data))
        }
        console.log("Cache: ",appCache);
        if (isAHomeTab(tabName)) {//validates the cache because its up to date
            console.log("Validated the cache",tabName);
            dispatch(validateTabCache({tabName}))//since the cache was just updated,it makes sense to validate it.Its the only point where its validated
        }else {
            console.log("Didnt validate the cache",tabName);
        }
        throttledStoreCache(dispatch);
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
export async function cacheAheadOfTime(tabName:StrictTabsType,isLast:boolean,affectOpacity:boolean):Promise<AppThunk>{
    return async (dispatch)=>{
        if (affectOpacity) {
            dispatch(setAheadCachingState('pending'))
        }
        const folderPath = await join_with_home(tabName);
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath);
        if (!(dirResult.value instanceof Error) && (dirResult.value !== null)) {//i only care about the success case here because the operation was initiated by the app and not the user and its not required to succeed for the user to progress with the app
            const fsNodes:FsNode[] = await Promise.all(dirResult.value);
            dispatch(addToCache({path:folderPath,data:fsNodes},tabName));
            if ((isLast) && (affectOpacity)) {
                dispatch(setAheadCachingState('success'))
            }
        }
    }
}
function isAHomeTab(folderName:string):folderName is AllTabTypes  {
    return (folderName=="Home") || (folderName=="Recent") || (folderName=="Desktop")  || (folderName=="Downloads") || (folderName=="Documents") || (folderName=="Pictures") || (folderName=="Music") || (folderName=="Videos")
}
function isCacheValid(folderName:string):AppThunk<boolean> {
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
function optimizeUI(folderPath:string):AppThunk {
    return (dispatch)=>{
        //[] array means its loading not that its empty
        dispatch(setFsNodes([]))//ensures that clicking on another tab wont show the previous one while loading to not look laggy
        dispatch(openCachedDirInApp(folderPath));//opens the cached dir in app in the meantime if any
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.
    }
}
async function loadIncrementally(fsNodesPromise:(Promise<FsNode>)[],fsNodes:FsNode[] ):Promise<AppThunk<Promise<FsNode[]>>>{
    return async (dispatch,getState):Promise<FsNode[]> =>{
        console.log("LOADING INC");
        const localFsNodes = [...fsNodes]
        for (const fsNodePromise of fsNodesPromise) {
            const fsNode:FsNode = await fsNodePromise;
            localFsNodes.push(fsNode);
            console.log("Pushed fs node",localFsNodes.length);
            if (localFsNodes.length == 1) {//batch 4 fsnodes before reflecting it in the ui
                console.log("BATCHED FS NODES REACHED");
                dispatch(spreadToFsNodes(localFsNodes))//reflect the 4 fsnodes in the ui
                localFsNodes.length = 0//clear the batch array for a new batch
            }
        }
        fsNodes = selectFsNodes(getState()) || []//fsnodes cant be null here because a series of fsnodes were already pushed above this line but the ts compiler cant infer that so i just provided a fallback value
        return fsNodes;
    }
}
async function loadAtOnce(fsNodesPromise:(Promise<FsNode>)[]):Promise<AppThunk<Promise<FsNode[]>>> {
    return async (dispatch):Promise<FsNode[]> =>{
        const fsNodes = await Promise.all(fsNodesPromise);
        dispatch(setFsNodes(fsNodes));
        return fsNodes;
    }
}
function inHomePage(folderName:string):AppThunk<boolean> {//it will only run if the cache is empty.dont forget
    return (_,getState):boolean => {
        const cache = selectCache(getState())
        const aotCachingState = selectAheadCachingState(getState());
        console.log("Cache length",cache.length);
        return ((folderName === "Home") && (aotCachingState === "pending"))
    }
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch,getState):Promise<void> =>{
        console.log("Folder path for cached",folderPath);
        const folderName:string = await base_name(folderPath,true);
        dispatch(setLoadingMessage(`Loading the folder: ${folderName}`));

        if (dispatch(isCacheValid(folderName))) {
            dispatch(optimizeUI(folderPath));
            return
        }
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath);//its fast because it doesnt load the file content
        if (dirResult.value instanceof Error) {
            dispatch(setFsNodes(null))//to ensure that they dont interact with an unstable folder in the ui
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`));
        }else if (dirResult.value == null) {
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
            dispatch(setFsNodes(null))//null fs nodes then means its empty
        }else {
            let fsNodes:FsNode[] = []//used to batch fsnodes for ui updates
            //*The inc processing is too slow.this is better.try to optmize if needed
            if (dispatch(inHomePage(folderName))) {//for user experience.if the home tab is opened and its still caching ahead of time and the cache is empty in otherwords,the first time using the app,show the files incrementally.other subsequent opens wont trigger this
                console.log("In home page was true");
                console.log("FSNODES VALUE",selectFsNodes(getState()));
                fsNodes = await dispatch(await loadIncrementally(dirResult.value,fsNodes))
            }else {
                fsNodes = await dispatch(await loadAtOnce(dirResult.value))
            }
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(addToCache({path:folderPath,data:fsNodes},folderName));//performs caching while the user can interact with the dir in the app./since the ui remains frozen as its caching ahead of time,there is no need to add a debouncing mechanism to prevent the user from switching to another tab while its caching
            console.log("Files:",fsNodes);
            dispatch(setAheadCachingState('success'))
        }
        //just ignore this.ive chosen to accept it
        // dispatch(setLoadingMessage(null))//to clear the loading message so that the unfreeze state resets back to false after an operation has finished loaded
    }
}
export async function openParentInApp():Promise<AppThunk> {
    return async (dispatch)=>{
        const parentPathResult:string = dispatch(getParent());
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
        const cache:CachedFolder[] = selectCache(getState());
        const json_cache:JsonCache = {data:cache}
        localStorage.setItem("appCache",JSON.stringify(json_cache))
        console.log("STORE CACHE WAS CALLED",cache);
    }
}
const throttledStoreCache:throttle<()=>AppThunk> = throttle(5000,
    (dispatch:AppDispatch)=>(dispatch(storeCache())),
    {noLeading:true, noTrailing: false,}
);


function isCreate(kind: WatchEventKind): kind is { create: WatchEventKindCreate } {
    return typeof kind === 'object' && 'create' in kind;
}
function isModify(kind: WatchEventKind): kind is { modify: WatchEventKindModify } {
    if (typeof kind !== 'object' || !('modify' in kind)) return false;
    const modifyKind = kind.modify;
    if (modifyKind.kind === 'any') {
        return false;
    }
    return true;
}
function isRemove(kind: WatchEventKind): kind is { remove: WatchEventKindRemove } {
    return typeof kind === 'object' && 'remove' in kind;
}

export async function watchHomeTabs():Promise<AppThunk> {
    return async (dispatch,getState)=>{
        console.log("CALLED FILE WATCHER");
        dispatch(setFsNodes([]))
        // dispatch(setLoadingMessage("loading"))
        await watchImmediate(
            [
                await join_with_home(""),//for home
                await join_with_home("AppData\\Roaming\\Microsoft\\Windows\\Recent"),
                await join_with_home("Desktop"),
                await join_with_home("Downloads"),
                await join_with_home("Documents"),
                await join_with_home("Pictures"),
                await join_with_home("Music"),
                await join_with_home("Videos"),
            ],
            async (event:WatchEvent) => {
                console.log('Logged directory event');
                if (isCreate(event.type) || isModify(event.type) || isRemove(event.type)) {
                    console.log("Logged modification",event);
                    const currentPath = selectCurrentPath(getState());
                    const triggeredPaths = event.paths;
                    for (const path of triggeredPaths) {
                        const parent = path.slice(0,path.lastIndexOf('\\'));
                        const tabName:AllTabTypes = await base_name(parent,true) as AllTabTypes;
                        dispatch(invalidateTabCache({tabName}));
                        if (tabName == "Home") {//auto reload the home page if its opened because my function wasnt built to load the home page ahead of time in mind because its the first page that loads when you open the app
                            dispatch(await openDirFromHome("Home"))
                        }else {
                            const currentPathBase:StrictTabsType = await base_name(currentPath,false) as StrictTabsType
                            if (currentPathBase == tabName) {//auto reload if the tab is currently opened
                                dispatch(await openDirFromHome(tabName))
                            }else {//auto reload the tab in the background ahead of time
                                dispatch(setLoadingMessage("Changes detected.Refreshing the app in the background."))
                                dispatch(await cacheAheadOfTime(tabName,true,false));
                                dispatch(setLoadingMessage("Done refreshing the app"))
                            }
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


