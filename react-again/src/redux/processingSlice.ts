//@ts-expect-error :I intetionally didnt install the type files because they were misleading the compiler about how to call the throttle function which was falsely flagging my code
import {throttle} from 'throttle-debounce';
import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home,base_name } from '../utils/rust-fs-interface';
import {v4 as uniqueID} from 'uuid';
import { AppDispatch } from './store';
import { watchImmediate, BaseDirectory, WatchEvent, WatchEventKind, WatchEventKindCreate, WatchEventKindModify, WatchEventKindRemove } from '@tauri-apps/plugin-fs';
import Fuse from 'fuse.js';
import { toast,ToastOptions,Bounce,Flip,Zoom} from 'react-toastify';


const fuseOptions = {
    keys: ['primary.nodeName','primary.fileExtension',],
    includeScore: true,
    threshold: 0.4,   
};
const fuseInstance:Fuse<FsNode> = new Fuse([],fuseOptions);
let searchBatchCount:number = 0;

export const toastConfig:ToastOptions = {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
}
export const loading_toastConfig:ToastOptions = {
    ...toastConfig,
    pauseOnHover:false,
    autoClose:false,
    transition:Zoom,
    toastId:"loading"
}

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

export interface SearchProgress {
    searchedNodes:number,
    totalNodes:number,
    lastThreshold:number
}

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
    searchResults:FsNode[] | null,
    terminateSearch:boolean,
    quickSearch:boolean,
    searchScores:number[],
    searchProgress:Record<string,SearchProgress>,//search progress for tracking
    selectedFsNodes:FsNode[] | null,//for selecting for deleting,copying or pasting
    error:Message//for writing app error
    notice:Message,//for writing app info
    loadingMessage:string | null//for loading messages
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
    searchResults:null,
    searchScores:[],
    terminateSearch:true,
    quickSearch:true,
    searchProgress:{},
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
        setSearchResults(state,action:PayloadAction<FsNode[] | null>) {
            state.searchResults = action.payload
        },
        setSearchTermination(state,action:PayloadAction<boolean>) {
            state.terminateSearch = action.payload
        },
        setQuickSearch(state,action:PayloadAction<boolean>) {
            state.quickSearch = action.payload
        },
        spreadToSearch(state,action:PayloadAction<FsNode[]>) {
            state.searchResults = [...(state.searchResults || []),...action.payload]
        },
        pushToSearch(state,action:PayloadAction<FsNode>) {
            state.searchResults = state.searchResults || []
            state.searchResults.push(action.payload)
        },
        pushToSearchScores(state,action:PayloadAction<number>) {
            state.searchScores.push(action.payload)
        },
        setSearchScores(state,action:PayloadAction<number[]>) {
            state.searchScores = action.payload
        },
        updateSearchProgress(state,action:PayloadAction<{path:string,searchedNodes:number,lastThreshold:number}>) {
            state.searchProgress[action.payload.path].searchedNodes += action.payload.searchedNodes;
            state.searchProgress[action.payload.path].lastThreshold = action.payload.lastThreshold
        },
        setProgress(state,action:PayloadAction<{path:string,progress:SearchProgress}>) {
            state.searchProgress[action.payload.path] = action.payload.progress
        },
        setWholeSearchProgress(state,action:PayloadAction<Record<string,SearchProgress>>) {
            state.searchProgress = action.payload
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
    setSearchResults,
    setSearchTermination,
    setQuickSearch,
    spreadToSearch,
    pushToSearch,
    pushToSearchScores,
    setSearchScores,
    updateSearchProgress,
    setProgress,
    setWholeSearchProgress,
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
export const selectSearchResults = (store:RootState):FsNode[] | null => store.processing.searchResults;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;
export const selectAheadCachingState = (store:RootState):CachingState => store.processing.aheadCachingState;
export const selectCache = (store:RootState):CachedFolder[] =>store.processing.cache || [];
export const selectSearchTermination = (store:RootState):boolean =>store.processing.terminateSearch;
export const selectQuickSearch = (store:RootState):boolean=>store.processing.quickSearch;
export const selectSearchProgress = (store:RootState):Record<string,SearchProgress> =>store.processing.searchProgress;
const selectSearchScores = (store:RootState):number[]=>store.processing.searchScores;
const selectIvalidatedTabs = (store:RootState):TabCacheInvalidation=>store.processing.invalidatedTabCache


export function returnFileContent(filePath:string):AppThunk<Promise<string | null>> {//returns the file with its content read
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



//^CACHING RELATED
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
                const cached_data = cachedFolder.data;
                const cache_length = cached_data.length;
                // dispatch(setFsNodes(cached_data))
                const half_length = Math.floor(cache_length / 2); 
                dispatch(setFsNodes(cached_data.slice(0,half_length)));
                dispatch(spreadToFsNodes(cached_data.slice(half_length,cache_length)));
                return
            }
        }
        //  [] array means its loading not that its empty
        dispatch(setFsNodes([]))//ensures that clicking on another tab wont show the previous one while loading to not look laggy
    }
}
export function cacheAheadOfTime(tabName:StrictTabsType,isLast:boolean,affectOpacity:boolean):AppThunk<Promise<void>>{
    return async (dispatch)=>{
        if (affectOpacity) {
            dispatch(setAheadCachingState('pending'))
        }
        const folderPath = await join_with_home(tabName);
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath,'arbitrary');
        if (!(dirResult.value instanceof Error) && (dirResult.value !== null)) {//i only care about the success case here because the operation was initiated by the app and not the user and its not required to succeed for the user to progress with the app
            const fsNodes:FsNode[] = await Promise.all(dirResult.value);
            dispatch(addToCache({path:folderPath,data:fsNodes},tabName));
            if ((isLast) && (affectOpacity)) {
                // dispatch(setAheadCachingState('success'))
            }
        }
    }
}
function cacheIsValid(folderName:string):AppThunk<boolean> {
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
function isAHomeTab(folderName:string):folderName is AllTabTypes  {
    return (folderName=="Home") || (folderName=="Recent") || (folderName=="Desktop")  || (folderName=="Downloads") || (folderName=="Documents") || (folderName=="Pictures") || (folderName=="Music") || (folderName=="Videos")
}



//^LOADING RELATED
//I am not actually using this functions.just exported it so that es lint will stop complaining.i may or may not use it later
export async function loadIncrementally(fsNodesPromise:(Promise<FsNode>)[],fsNodes:FsNode[] ):Promise<AppThunk<Promise<FsNode[]>>>{
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
//I exported this for the same reason as loadIncrementally
export function inHomePage(folderName:string):AppThunk<boolean> {//it will only run if the cache is empty.dont forget
    return (_,getState):boolean => {
        const aotCachingState = selectAheadCachingState(getState());
        return ((folderName === "Home") && (aotCachingState === "pending"))
    }
}


//^OPEN DIR RELATED
/**
 * It updates the ui by loading the fsnodes array into the app state using one of two rendering techniques depending if the dir is the home tab and returns a modified fsnodes that can be used for caching
 */
function updateUI(value:(Promise<FsNode>)[]):AppThunk<Promise<FsNode[]>> {
    return async (dispatch):Promise<FsNode[]> => {
        const localFsNodes = await Promise.all(value);
        dispatch(setFsNodes(localFsNodes));
        return localFsNodes;
    }
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export function openDirectoryInApp(folderPath:string):AppThunk<Promise<void>> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        console.log("Folder path for cached",folderPath);
        const folderName:string = await base_name(folderPath,true);
        dispatch(setLoadingMessage(`Loading the folder: ${folderName}`));//the loading message freezes the ui
        dispatch(openCachedDirInApp(folderPath));
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.
        dispatch(setSearchResults(null))//to clear search results
        
        if (dispatch(cacheIsValid(folderName))) {
            console.log("CACHE IS VALID");
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            return
        }
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(folderPath,'arbitrary');//its fast because it doesnt load the file content
        if (dirResult.value instanceof Error) {
            dispatch(setFsNodes(null))//to ensure that they dont interact with an unstable folder in the ui
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`));
        }else if (dirResult.value == null) {
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
            dispatch(setFsNodes(null))//null fs nodes then means its empty
        }else {
            let fsNodes:FsNode[] = []//used to batch fsnodes for ui updates
            fsNodes = await dispatch(updateUI(dirResult.value))
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(addToCache({path:folderPath,data:fsNodes},folderName));//performs caching while the user can interact with the dir in the app./since the ui remains frozen as its caching ahead of time,there is no need to add a debouncing mechanism to prevent the user from switching to another tab while its caching
            console.log("Files:",fsNodes);
            dispatch(setAheadCachingState('success'))
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
        return currentPath
    }
}



//^SEARCH RELARED
function searchUtil(fsNodes:FsNode[],searchQuery:string):AppThunk {
    return (dispatch) => {
        console.log("FSNODES VALUE NOW",fsNodes);
        if (fsNodes) {
            fuseInstance.setCollection(fsNodes);
            const searchResults = fuseInstance.search(searchQuery);
            const matchedFsNodes: FsNode[] = searchResults.map(result => result.item);
            console.log("MATCHED FS NODES",matchedFsNodes);
            if (matchedFsNodes.length) {//to reduce ui flickering,only spread to the search results if something matched
                dispatch(spreadToSearch(matchedFsNodes));
                searchResults.map(result=>{//only push the scores if there are any matched results
                    if (result.score) {//to prevent ts from complaining because if there are matched results,this can never fail.this is here to help ts know my code is valid
                        dispatch(pushToSearchScores(result.score))
                    }
                })
            }
        }
    }
}
function removeAllDots(str:string):string {
    return str.replace(/\./g, '');
}
function longQueryOptimization(quickSearch:boolean,fsNodes:FsNode[],searchQuery:string,isQueryLong:boolean):AppThunk<boolean> {
    return (dispatch):boolean=>{
        //This early termination is done at the batch level
        if (quickSearch) {//only performing this loop if quick search is on.it will be a waste if it runs on full search
            for (const fsNodeInBatch of fsNodes) {
                const trimmedNode = removeAllDots(fsNodeInBatch.primary.nodeName.trim().toLowerCase());//making it insensitive to file extensions because the node can be a folder or a file and he search query can target either depending on whether an extension was included or not
                const trimmedQuery = removeAllDots(searchQuery.trim().toLowerCase());
                const isRoughMatch = (trimmedNode.startsWith(trimmedQuery))
                console.log("Quick search",quickSearch,"Query length",searchQuery.length,"Exact match",isRoughMatch,"trimmed node",trimmedNode,"trimmed query",trimmedQuery);
                if (isQueryLong && isRoughMatch) {
                    console.log("Found early result!!");
                    dispatch(pushToSearch(fsNodeInBatch));
                    return true;
                }
            }
            return false
        }
        return false
    }
}
type ThresholdRange = {min:number,max:number}
function isInThresholdRange(num: number, ranges: ThresholdRange[]): boolean {
    return ranges.some(range => {
        return num >= range.min && num <= range.max
    });
}
function updateSearchResults(fsNode:FsNode,fsNodes:FsNode[],searchQuery:string,isLastFsNode:boolean,path:string):AppThunk {
    return (dispatch,getState)=>{
        const quickSearch:boolean = selectQuickSearch(getState());
        const isQueryLong:boolean = searchQuery.length >= 10
        const searchBatchSize = searchBatchCount > 0 ? 15 : 5;

        console.log("SEARCH BATCH SIZE FOR FSNODES",searchBatchSize,"FSNODES",fsNodes);
        fsNodes.push(fsNode)//push the files
        if ((fsNodes.length >= searchBatchSize) || (isLastFsNode)) {
            const nodeCount:number = fsNodes.length;
            const anyRoughMatches:boolean = dispatch(longQueryOptimization(quickSearch,fsNodes,searchQuery,isQueryLong))
            if (anyRoughMatches) {//i believe that this means that when it reaches the last node of the batch,it will check if there were any exact matches.if so,terminate and return else,proceed with fuzzy search
                console.log("Terminated early!!");
                dispatch(setSearchTermination(true));
                fsNodes.length = 0;
                return
            }else if (quickSearch && !(anyRoughMatches) && isQueryLong) {
                console.log("Discarded this batch");
                fsNodes.length = 0//prevents stale data
                return
            }else {
                dispatch(searchUtil(fsNodes,searchQuery));
                if (!quickSearch) {//only do progress on full search
                    const progress:SearchProgress = selectSearchProgress(getState())[path]
                    const percent:number = (progress.searchedNodes/progress.totalNodes) * 100;
                    const lastThreshold:number = progress.lastThreshold;
                    console.log("PATH",path,"PERCENT",percent);
                    const thresholdRanges: ThresholdRange[] = [
                        { min: 15, max: 25 },
                        { min: 45, max: 55 },
                        { min: 75, max: 85 },
                        { min: 95, max: 100 },
                    ];
                    if (isInThresholdRange(percent,thresholdRanges)) {
                        Promise.resolve().then(()=>dispatch(updateSearchProgress({path,searchedNodes:nodeCount,lastThreshold})))
                    }else {
                        dispatch(updateSearchProgress({path,searchedNodes:nodeCount,lastThreshold}))
                    }
                }
                searchBatchCount += 1;
                fsNodes.length = 0//prevents stale data
                return;
            }
        }
    }
}
function aggressiveFilter(data:string,query:string):boolean {
    if ((data.trim().toLowerCase().includes(query.trim().toLowerCase()))) {
        return true
    }
    return false
}
export function toggleQuickSearch():AppThunk {
    return (dispatch,getState)=>{
        const quickSearch:boolean = selectQuickSearch(getState());
        dispatch(setQuickSearch(!(quickSearch)))
    }
}
//*This is the new async thunk pattern ill be using from hence forth,ill refactor the old ones once ive finsihed the project
function searchRecursively(path:string,searchQuery:string):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        const shouldTerminate:boolean = selectSearchTermination(getState());
        console.log("SHOULD TERMINATE",shouldTerminate);
        if (shouldTerminate) {
            return
        }
        const quickSearch:boolean = selectQuickSearch(getState());
        const order = (quickSearch)?'alphabetical':'date'
        const dirResult:FsResult<(Promise<FsNode>)[] | Error | null> = await readDirectory(path,order);
        console.log("DIR RESULT",dirResult.value);
        if ((dirResult.value !== null) && !(dirResult.value instanceof Error)) {
            const fsNodes:FsNode[] = []
            const localFsNodes:FsNode[] = await Promise.all(dirResult.value);
            const totalNodes:number = localFsNodes.length;
            console.log("Local fs nodes",localFsNodes);
            if (!quickSearch) {
                dispatch(setProgress({
                    path,
                    progress:{
                        totalNodes,
                        searchedNodes:0,
                        currentThreshold:0
                    }
                }));
            }
            for (const [localIndex,fsNode] of localFsNodes.entries()) {
                const isLastFsNode = localIndex == (localFsNodes.length-1);
                console.log("Is last fsnode",isLastFsNode);
                if (fsNode.primary.nodeType == "File") {//passing islast is necessary for quick search even if it matches or not because it needs to terminate the batch if the one that survived is the only match for example and not the last at the same time
                    if (quickSearch) {
                        if (isLastFsNode || aggressiveFilter(fsNode.primary.nodeName,searchQuery) || aggressiveFilter(fsNode.primary.fileExtension as string,searchQuery)) {
                            console.log("PASSED YOUR FILE TO UPDATE",fsNode.primary.nodePath);
                            dispatch(updateSearchResults(fsNode,fsNodes,searchQuery,isLastFsNode,path))
                        }else {
                            console.log("Filtered out the file:",fsNode.primary.nodePath);
                        }
                    }else {//update regardless
                        dispatch(updateSearchResults(fsNode,fsNodes,searchQuery,isLastFsNode,path))
                    }
                }else if (fsNode.primary.nodeType == "Folder") {
                    //i cant do aggressive filter here because the files within the folder will be in custody
                    if (quickSearch) {
                        if (isLastFsNode || aggressiveFilter(fsNode.primary.nodeName,searchQuery)) {
                            console.log("PASSED YOUR FOLDER TO UPDATE",fsNode.primary.nodePath);
                            dispatch(updateSearchResults(fsNode,fsNodes,searchQuery,isLastFsNode,path))
                        }else {
                            console.log("Filtered out the folder",fsNode.primary.nodePath);
                        }
                    }else {
                        dispatch(updateSearchResults(fsNode,fsNodes,searchQuery,isLastFsNode,path))
                    }
                }
            }
            //breadth first traversal
            for (const fsNode of localFsNodes) {
                if (fsNode.primary.nodeType == "Folder") {
                    await dispatch(searchRecursively(fsNode.primary.nodePath,searchQuery))//read the files of the folder and push that
                }
            }
        }
    }
}
export function searchDir(searchQuery:string,startTime:number):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("SEARCH QUERY LENGTH",searchQuery.length);
        //debouncing this function never works so what i did to prevent spamming is to terminate the previoud search before instatiating this new one
        dispatch(setSearchTermination(true));
        dispatch(setSearchTermination(false));
        dispatch(setSearchResults([]));
        dispatch(setSearchScores([]));
        dispatch(setWholeSearchProgress({}));
        searchBatchCount = 0;

        if (searchQuery.length == 0) {
            toast.dismiss("loading");
            dispatch(setSearchResults(null));
            dispatch(setSearchTermination(true));
            dispatch(setWholeSearchProgress({}));
            return
        }
        const currentPath:string = selectCurrentPath(getState());
        await dispatch(searchRecursively(currentPath,searchQuery));
        
        const quickSearch = selectQuickSearch(getState());
        const shouldTerminate:boolean = selectSearchTermination(getState());
        if (!(quickSearch) && !(shouldTerminate)) {
            toast.loading("Sorting search results:",{...loading_toastConfig,position:"bottom-right"});
            const searchResults:FsNode[] = selectSearchResults(getState()) || [];
            const resultScores:number[] = selectSearchScores(getState());
            if (searchResults.length > 0 && (searchResults.length === resultScores.length)) {//i believe this will only fail when theres no search result
                const pairedResults = searchResults.map((node, i) => ({node,score: resultScores[i]}));
                pairedResults.sort((a, b) => a.score - b.score);
                const sortedResults = pairedResults.map(pair => pair.node);//safer,clearer and optimized enough to return each node as a copy into the array rather than directly mutating paired results in an attemp to save memory
                dispatch(setSearchResults(sortedResults));
                dispatch(setSearchScores([]));
                console.log("sorted the search results");
            }
        }
        const endTime = performance.now();
        const timeInMs = endTime - startTime;
        const timeInSeconds = (timeInMs / 1000).toFixed(3);
        toast.dismiss();
        toast.success(`Done searching in ${timeInSeconds} seconds`,{...toastConfig,autoClose:500,transition:Flip,position:"bottom-right"});
        dispatch(setSearchTermination(true));
    }
}
export function terminateSearch():AppThunk {
    return (dispatch)=>{
        dispatch(setSearchTermination(true))
        toast.dismiss();
        toast.info("Search terminated",{...toastConfig,autoClose:500,transition:Flip});
    }
}



//^SMART RELOADING RELATED
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

export function watchHomeTabs():AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("CALLED FILE WATCHER");
        dispatch(setFsNodes([]))
        dispatch(setLoadingMessage("loading"))
        await watchImmediate(
            [
                await join_with_home("Home"),//for home
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
                            await dispatch(openDirFromHome("Home"))
                        }else {
                            const currentPathBase:StrictTabsType = await base_name(currentPath,false) as StrictTabsType
                            if (currentPathBase == tabName) {//auto reload if the tab is currently opened
                                await dispatch(openDirFromHome(tabName))
                            }else {//auto reload the tab in the background ahead of time.reloading it in the background is very fast because if no ui updates
                                dispatch(setLoadingMessage("Changes detected.Refreshing the app in the background."))
                                await dispatch(cacheAheadOfTime(tabName,true,false));
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


