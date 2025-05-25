//@ts-expect-error :I intetionally didnt install the type files because they were misleading the compiler about how to call the throttle function which was falsely flagging my code
import {throttle} from 'throttle-debounce';
import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home,base_name } from '../utils/rust-fs-interface';
import {v4 as uniqueID} from 'uuid';
import { AppDispatch } from './store';
import { watchImmediate, BaseDirectory, WatchEvent } from '@tauri-apps/plugin-fs';
import { toast,ToastOptions,Bounce,Flip,Zoom} from 'react-toastify';
import { Heap } from 'heap-js';
import { normalizeString,roundToTwo,aggressiveFilter} from '../utils/quarks';
import { getMatchScore } from '../utils/fuzzy-engine';
import { isCreate,isRemove,isModify } from '../utils/watcher-utils';
import { heavyFolders ,searchCache,heuristicsCache, Queries,spawnSearchCacheWatcher} from '../utils/globals';
// import { info } from '@tauri-apps/plugin-log';

// console.log = (...args) => {
//     info(args.join(' '));
// };



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
type DirResult = FsResult<(Promise<FsNode>)[] | Error | null> | FsResult<FsNode[]>
type DeferredSearch = {path:string,priority:number}
type Cache = Record<NodePath,FsNode[]>;
type CachePayload = {path:NodePath,data:FsNode[]}
type CachingState = 'pending' | 'success';
type StrictTabsType = 'Recent' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos';
type AllTabTypes = 'Home' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos'
type  invalidationData = {tabName:AllTabTypes}
type NodePath = string;
type Queue = NodePath[];



interface  TabCacheInvalidation {
    Home:boolean,
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
export interface NodeCount {
    path:string | null,
    save:boolean
}

export interface processingSliceState {//by using null unions instead of optional types,i ensure that my app doesnt accidenteally worked with an undefined value
    currentPath:string,//as breadcrumbs
    tabNames:string[],//home tabs
    fsNodes:FsNode[] | null,//current files loaded
    cache:Cache,
    aheadCachingState:CachingState,
    invalidatedTabCache:TabCacheInvalidation,
    searchResults:FsNode[] | null,
    terminateSearch:boolean,
    quickSearch:boolean,
    searchScores:number[],
    nodeCount:NodeCount,//This is for number of nodes that have been searched during a search recursion
    selectedFsNodes:FsNode[] | null,//for selecting for deleting,copying or pasting
    error:Message//for writing app error
    notice:Message,//for writing app info
    loadingMessage:string | null//for loading messages
    sortBy:SortingOrder,//sorting order of the files
    viewBy:View,//changes the layout of the folder content
    showDetailsPane:boolean//to show extra details like charts or disk usage,
    openedFile:FsNode | null
}


const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos'],//Home and recent are only local to sidebar cuz there is no dir named home and recent on the fs
    fsNodes:null,
    cache:{},
    aheadCachingState:'pending',
    invalidatedTabCache:{Home:true,Desktop:true,Downloads:true,Documents:true,Pictures:true,Music:true,Videos:true},
    selectedFsNodes:null,
    error:{id:"",message:null},//the ids is to ensure that the same error can pop up twice
    notice:{id:"",message:null},
    loadingMessage:"loading",//no id here because only one thing can be loaded at a time
    searchResults:null,
    searchScores:[],
    nodeCount:{path:'',save:false},
    terminateSearch:true,
    quickSearch:true,
    sortBy:'name',
    viewBy:'details',
    showDetailsPane:true,
    openedFile:null
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
        spreadToFsNodes(state,action:PayloadAction<FsNode[]>) {
            state.fsNodes = [...(state.fsNodes || []),...action.payload]
        },
        setCache(state,action:PayloadAction<Cache>) {
            state.cache = action.payload
        },
        recordInCache(state,action:PayloadAction<CachePayload>) {
            state.cache[action.payload.path] = action.payload.data
        },
        //its the same effect as shifting but it does this starting from index 8 so that the ones that are cached ahead of time will be preserved on the cache threshold
        shiftCache(state) {
            const ninthKey = Object.keys(state.cache)[9];
            if (ninthKey !== undefined) {
                state.cache = Object.fromEntries(
                    Object.entries(state.cache).filter(([key]) => key !== ninthKey)
                );
            }
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
        resetNodeCount(state) {
            state.nodeCount = {path:'',save:false}
        },
        clearNodeCount(state) {
            state.nodeCount = {path:null,save:false}
        },
        saveNodeCount(state) {
            state.nodeCount.save = true
        },
        setNodePath(state,action:PayloadAction<string>) {
            state.nodeCount.path = action.payload
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
        },
        setOpenedFile(state,action:PayloadAction<FsNode | null>) {
            state.openedFile = action.payload
        }
    },
})


export const {
    setCurrentPath,
    setFsNodes,
    spreadToFsNodes,
    setCache,
    recordInCache,
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
    resetNodeCount,
    clearNodeCount,
    saveNodeCount,
    setNodePath,
    setSortBy,
    setView,
    setShowDetails,
    setOpenedFile
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
export const selectSearchTermination = (store:RootState):boolean =>store.processing.terminateSearch;
export const selectQuickSearch = (store:RootState):boolean=>store.processing.quickSearch;
export const selectNodeCount = (store:RootState):NodeCount=>store.processing.nodeCount;
export const selectOpenedFile = (store:RootState):FsNode | null =>store.processing.openedFile;
const selectCache = (store:RootState):Cache =>store.processing.cache;
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


 //i have to remove the slicing because the cache needs to be complete if its going to be validated for ui interactions
// data.data.slice(0,101)//ensures that only a 100 fsnodes are stored in the cache
//^CACHING RELATED
function addToCache(arg:CachePayload,folderName:string):AppThunk {
    return (dispatch,getState)=>{
        console.log("Called add to cache");
        const appCache:Cache = selectCache(getState());
        if (Object.keys(appCache).length >= 50) {//evict an item from the cache once it reaches 20
            console.log("Cache length is greater than 3");
            dispatch(shiftCache())
        }
        const normalizedPath = arg.path.replace(/\\/g, '/');//to convert \ slash in widnows path to / slash
        let isHeavy:boolean = false;
        for (const heavyPath of heavyFolders) {
            if (normalizedPath.endsWith(heavyPath)) {
                console.log("Didnt cache heavy folder:",normalizedPath);
                isHeavy = true
                break;//it can only match one path at a given time so we dont need to process the rest
            }
        }
        let dirNodes:FsNode[] = arg.data;
        if (!isAHomeTab(folderName)) {//bound the number of fsnodes per record in the cache if it isnt a home tab as unlike the home tab,they are always invalidated on reopen but they are displayed in the ui frozen in the meantime
            dirNodes = arg.data.slice(0,100)
        }
        if (!isHeavy) {//only add the folder to the cache if it isnt heavy
            dispatch(recordInCache({path:arg.path,data:dirNodes}))
        }
        console.log("Cache: ",appCache);
        if (isAHomeTab(folderName)) {//validates the cache because its up to date
            console.log("Validated the cache",folderName);
            dispatch(validateTabCache({tabName:folderName}))//since the cache was just updated,it makes sense to validate it.Its the only point where its validated
        }else {
            console.log("Didnt validate the cache",folderName);
        }
        throttledStoreCache(dispatch);
    }
}
function openCachedDirInApp(folderPath:string):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("called open dir in app");
        const cache:Cache = selectCache(getState());
        const cached_data = cache[folderPath] || [];//  [] array means its loading not that its empty
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


//^OPEN DIR RELATED
function updateUI(value:(Promise<FsNode>)[]):AppThunk<Promise<FsNode[]>> {
    return async (dispatch):Promise<FsNode[]> => {
        const localFsNodes = await Promise.all(value);
        const nodes_length = localFsNodes.length;
        const slice_number = 10
        if (nodes_length < slice_number) {
            dispatch(setFsNodes(localFsNodes))
        }else {
            dispatch(setFsNodes(localFsNodes.slice(0,slice_number)));
            await new Promise((resolve) => queueMicrotask(() => resolve(undefined)))
            dispatch(spreadToFsNodes(localFsNodes.slice(slice_number,nodes_length)));
        }
        return localFsNodes;
    }   
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export function openDirectoryInApp(folderPath:string):AppThunk<Promise<void>> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        console.log("Folder path for cached",folderPath);
        // dispatch(setFsNodes([]))
        await dispatch(openCachedDirInApp(folderPath));
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.

        const folderName:string = await base_name(folderPath,true);
        dispatch(setLoadingMessage(`Loading the folder: ${folderName}`));//the loading message freezes the ui
        dispatch(setOpenedFile(null))
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
        console.log("PARENT PATH: ",currentPath);
        return currentPath
    }
}



//^SEARCH RELARED
export function toggleQuickSearch():AppThunk {
    return (dispatch,getState)=>{
        const quickSearch:boolean = selectQuickSearch(getState());
        dispatch(setQuickSearch(!(quickSearch)))
    }
}
function searchUtil(fsNodes:FsNode[],searchQuery:string):AppThunk<Promise<void>> {
    return async (dispatch) => {//it uses the fuzzy engine to know which results to display
        console.log("FSNODES VALUE NOW",fsNodes);
        if (fsNodes) {
            const matchedFsNodes:FsNode[] = [] 
            const minThreshold:number = 10;//default min threshold
            let acceptableScore = 30
            if (searchQuery.length <= 5) {
                acceptableScore = 15
            }
            for (const node of fsNodes) {
                const score1 = getMatchScore(searchQuery,node.primary.nodeName,minThreshold);
                const score2 = getMatchScore(searchQuery,(node.primary.fileExtension || ""),minThreshold);
                const score = (score2>score1)?score2:score1;
                if (score >= acceptableScore) {
                    dispatch(pushToSearchScores(score))
                    matchedFsNodes.push(node)
                }
            }
            console.log("MATCHED FS NODES",matchedFsNodes);
            if (matchedFsNodes.length) {//to reduce ui flickering,only spread to the search results if something matched
                dispatch(spreadToSearch(matchedFsNodes));
            };
        }
    }
}
function longQueryOptimization(quickSearch:boolean,fsNodes:FsNode[],searchQuery:string,isQueryLong:boolean):AppThunk<boolean> {
    return (dispatch):boolean=>{
        //This early termination is done at the batch level
        if (quickSearch && isQueryLong) {//only performing this loop if quick search is on.it will be a waste if it runs on full search
            let anyRoughMatches:boolean = false
            for (const fsNodeInBatch of fsNodes) {
                const normalizedNode = normalizeString(fsNodeInBatch.primary.nodeName);//making it insensitive to file extensions because the node can be a folder or a file and he search query can target either depending on whether an extension was included or not
                const normalizedQuery = normalizeString(searchQuery);
                const isRoughMatch = (normalizedNode.startsWith(normalizedQuery))
                console.log("Quick search",quickSearch,"Query length",searchQuery.length,"Exact match",isRoughMatch,"trimmed node",normalizedNode,"trimmed query",normalizedQuery);
                if (isRoughMatch) {
                    console.log("Found early result!!");
                    dispatch(pushToSearch(fsNodeInBatch));
                    anyRoughMatches = true
                }
            }
            return anyRoughMatches
        }
        return false
    }
}
function updateSearchResults(fsNode:FsNode,fsNodes:FsNode[],searchQuery:string,isLastFsNode:boolean):AppThunk<Promise<void>> {
    return async (dispatch,getState) =>{
        const quickSearch:boolean = selectQuickSearch(getState());
        const isQueryLong:boolean = searchQuery.length >= 10;
        const searchBatchSize:number = 10;//default batch size
        fsNodes.push(fsNode)//push the files
        if ((fsNodes.length >= searchBatchSize) || (isLastFsNode)) {
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
                await dispatch(searchUtil(fsNodes,searchQuery));
                fsNodes.length = 0//prevents stale data
                return;
            }
        }
    }
}
async function heuristicsAnalysis(deferredPaths:Record<string,boolean>,currentSearchPath:string,rootPath:string,processHeavyFolders:boolean,heavyFolderQueue:string[],deferredHeap: Heap<DeferredSearch>,searchQuery:string,nodeResult:Promise<FsNode>[] | FsNode[]):Promise<boolean> {
    //*Heuristic analysis
    const isDeferred:boolean = deferredPaths[currentSearchPath] || false;
    console.log((!isDeferred)?`CURRENT SEARCH PATH ${currentSearchPath}`:`CURRENTLY PROCESSING DEFERRED PATH: ${currentSearchPath}`);
    if ((currentSearchPath !== rootPath) && !(isDeferred)) {//only perform heuristics on sub folders of the root path cuz if not,the root path will be forever deferred if it doesnt match the heuristics not to mention its a waste of runtime to do it on the root since the root must always be searched and i also dont want it to perform relvance calc on something that has already gone through it like deferred paths when the deferred queue has its turn.    
        //static heuristics 
        if (!processHeavyFolders) {//this reads that if the search loop shouldnt process any heavy folders,then push it to the heavy folder queue for the next search loop
            const normalizedPath = currentSearchPath.replace(/\\/g, '/');// convert backslashes to slashes if on Windows
            let isHeavy:boolean = false
            for (const heavyPath of heavyFolders) {
                if (normalizedPath.endsWith(heavyPath)) {
                    console.log("Deferred heavy folder:",currentSearchPath);
                    heavyFolderQueue.push(currentSearchPath);
                    isHeavy = true
                    break;//it can only match one path at a given time so we dont need to process the rest
                }
            }
            if (isHeavy) {//i had to use a flag cuz continuing in the for loop will continue the for loop itself not the search loop
                return true
            }
        }
        //dynamic heuristics.it uses the fuzzy engine to know which folder to prioritize first
        const totalNodes = nodeResult.length || 1;//fallback for edge cases where totalNodes may be zero
        const relevanceThreshold = 50;
        const matchPercentThreshold = 80;
        const sizeBonus:number = roundToTwo( (1 / (1 + totalNodes)) * 5);//added size bonus to make ones with smaller sizes more relevant and made it range from 0-5 so that it doesnt negligibly affects the relevance score
        
        let relevantNodes:number = 0;
        let relevancePercent:number = 0;
        let processImmediately = false;


        const cachedQueries:Queries | undefined = heuristicsCache.get(currentSearchPath);
        const cachedQuery:boolean | null = (cachedQueries)?cachedQueries[searchQuery]:null
        if (cachedQuery !== null) {
            const shouldDefer:boolean = cachedQuery;
            console.log("CACHED QUERY: ",cachedQuery);
            if (shouldDefer) {
                console.log("DEFERRED EARLY: ",currentSearchPath);
                deferredPaths[currentSearchPath] = true
                deferredHeap.push({path:currentSearchPath,priority:relevancePercent + sizeBonus})
                return true//skip the current iteration of the outer while loop of the caller
            }else {
                console.log("PROCESSED EARLY: ",currentSearchPath);
                return false//dont skip the current iteration of the outer while loop of the caller
            }
        }

        //it defers the parent folder if its children arent relevant enough not that it defers its children.each child will have their own time
        for (const node of nodeResult) {
            const awaitedNode = await node;
            const minThreshold = 10
            const score1 = getMatchScore(searchQuery,awaitedNode.primary.nodeName,minThreshold);
            const score2 = getMatchScore(searchQuery,(awaitedNode.primary.fileExtension || ""),minThreshold);
            const matchScore = (score2>score1)?score2:score1;

            // console.log("MATCH SCORE","NODE:",awaitedNode.primary.nodeName,"|SCORE:",matchScore);
            if (matchScore >= 40) {//the number of matches increases qualitative relevance
                relevantNodes += 1
                relevancePercent = roundToTwo( (relevantNodes / totalNodes) * 100 )//to ensure that the relevance percent is always updated upon looping
                processImmediately = (relevancePercent >= relevanceThreshold) || (matchScore >= matchPercentThreshold)//the match score is used to check for the quality of the relevance as usual
                
                if (processImmediately) {
                    console.log("SEARCH PATH:",currentSearchPath,"IS BEING PROCESSED IMMEDIATELY");
                    heuristicsCache.set(currentSearchPath,{...cachedQueries,[searchQuery]:false});
                    spawnSearchCacheWatcher(currentSearchPath)
                    break//early termination once enough relevance has been reached
                }
            };
        }
        console.log("HEURISTIC ANALYSIS OF ",currentSearchPath,"RELEV SCORE",relevancePercent);
        if ( ((relevancePercent + sizeBonus) < relevanceThreshold) && (!processImmediately)) {//defer if it isnt relevant enough or if it isnt flagged to process immediately
            console.log("DEFERRED SEARCH PATH: ",currentSearchPath,'PRIORITY',relevancePercent,"WITH SIZE BONUES",relevancePercent + sizeBonus);
            deferredPaths[currentSearchPath] = true
            deferredHeap.push({path:currentSearchPath,priority:relevancePercent + sizeBonus});//defer for later.it defers the current search path unlike the static heuristics
            heuristicsCache.set(currentSearchPath,{...cachedQueries,[searchQuery]:true});
            spawnSearchCacheWatcher(currentSearchPath)
            return true; // Skip processing now
        }
        return false
    }else {
        return false
    }
}
function getDirResult(currentSearchPath:string,rootPath:string):AppThunk<Promise<DirResult>> {
    return async (_,getState)=>{
        const cache:Cache = selectCache(getState());
        const searchedData = searchCache.get(currentSearchPath);
        console.log(' processingSlice.ts:629 => return => searchedData:', searchedData);
        if (currentSearchPath === rootPath) {//since the rootpath is the currentpath opened in the app,it will just select the fsnodes directly from the app state if its processing the rootpath
            console.log("SEARCHING ROOT PATH");
            return FsResult.Ok(selectFsNodes(getState()) || [])

        }else if (currentSearchPath in cache) {//fallback to the ui cache if its not currently opened
            console.log("USING CACHED FSNODES FOR", currentSearchPath);
            searchCache.delete(currentSearchPath)//removes it from the search cache since its in the ui cache to preserve memory
            return FsResult.Ok(cache[currentSearchPath]);

        }else if (searchedData) {//check if it has been searched before.the search cache is an in memory cache unlike my ui cache thats serialized to local storage so once the app is closed,the data is lost so its a last resort to not reading from the disk
            console.log("USING SEARCHED FSNODES FOR", currentSearchPath);
            return FsResult.Ok(searchedData)

        }else {//if none of the cases were fulfilled,read it from the disk
            const dirResult = await readDirectory(currentSearchPath,'arbitrary');//arbritrayry order is preferred here since it uses its own heuristic to prioritize folders over metadata like size.ill still leave the other options in the tauri side in case of future requirements
            if ((dirResult.value !== null) && !(dirResult.value instanceof Error)) {//cache before return so that it caches as it searches
                const result = await Promise.all(dirResult.value)
                searchCache.set(currentSearchPath,result);
                spawnSearchCacheWatcher(currentSearchPath)
            }
            return dirResult
        }
    }
}
//*This is the new async thunk pattern ill be using from hence forth,ill refactor the old ones once ive finsihed the project
function searchInBreadth(rootPath:string,searchQuery:string,heavyFolderQueue:string[],processHeavyFolders:boolean,startTime:number):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        const queue:Queue = (processHeavyFolders)?heavyFolderQueue:[rootPath];//switch to heavy folders as called by the searchDir
        const deferredPaths:Record<string,boolean> = {};
        const deferredHeap = new Heap((a:DeferredSearch, b:DeferredSearch) => b.priority - a.priority);
        deferredHeap.init([]);

        while ((queue.length > 0) || !(deferredHeap.isEmpty())) {
            const shouldTerminate:boolean = selectSearchTermination(getState());
            console.log("SHOULD TERMINATE",shouldTerminate);
            if (shouldTerminate) {//terminate the search on user command
                console.log("FORCEFUL SEARCH TERMINATION");
                dispatch(clearNodeCount());
                searchTime(startTime)
                return
            }
            console.log("Queue value:",queue);
            const currentSearchPath = queue.shift()!;
            if (queue.length === 0) {//add all deferred items to the queue after the queue for the dir level has been processed
                console.log("DEFERRED QUEUE",deferredHeap);
                for (const item of deferredHeap) {//This moves the deferred folders to main queue for processing
                    queue.push(item.path)
                }
                deferredHeap.clear() // Clear deferred queue
            }
            const dirResult:DirResult = await dispatch(getDirResult(currentSearchPath,rootPath))
            console.log("DIR RESULT",dirResult.value);

            if ((dirResult.value !== null) && !(dirResult.value instanceof Error)) {
                const nextIteration:boolean = await heuristicsAnalysis(deferredPaths,currentSearchPath,rootPath,processHeavyFolders,heavyFolderQueue,deferredHeap,searchQuery,dirResult.value);
                if (nextIteration) {
                    console.log("Continued the loop");
                    continue
                }
                //*Search Processing
                const fsNodes:FsNode[] = []//this is the batch used per dir level so that it doesnt directly call fuse on every node but rather in batches
                const quickSearch:boolean = selectQuickSearch(getState());
                if (!quickSearch) {//only show progress of crawled folders on full search
                    dispatch(resetNodeCount());
                    dispatch(setNodePath(currentSearchPath));
                }
                // console.log("Local fs nodes",localFsNodes);
                for (const [localIndex,fsNode] of dirResult.value.entries()) {
                    if (shouldTerminate) {//terminate the search on user command
                        console.log("FORCEFUL SEARCH TERMINATION");
                        dispatch(clearNodeCount());
                        searchTime(startTime)
                        return
                    }
                    const isLastFsNode = localIndex == (dirResult.value.length-1);
                    const awaitedFsNode = await fsNode;
                    const batchThunk = updateSearchResults(awaitedFsNode,fsNodes,searchQuery,isLastFsNode)
                    console.log("Is last fsnode",isLastFsNode);
                    if (awaitedFsNode.primary.nodeType == "File") {//passing islast is necessary for quick search even if it matches or not because it needs to terminate the batch if the one that survived is the only match for example and not the last at the same time
                        if (quickSearch) {
                            if (isLastFsNode || aggressiveFilter(awaitedFsNode.primary.nodeName,searchQuery) || aggressiveFilter(awaitedFsNode.primary.fileExtension,searchQuery)) {
                                console.log("PASSED YOUR FILE TO UPDATE",awaitedFsNode.primary.nodePath);
                                await dispatch(batchThunk)
                            }else { console.log("Filtered out the file:",awaitedFsNode.primary.nodePath);}
                        }else {//update regardless
                            await dispatch(batchThunk)
                        }
                    }else if (awaitedFsNode.primary.nodeType == "Folder") {
                        //i cant do aggressive filter here because the files within the folder will be in custody
                        if (quickSearch) {
                            if (isLastFsNode || aggressiveFilter(awaitedFsNode.primary.nodeName,searchQuery)) {
                                console.log("PASSED YOUR FOLDER TO UPDATE",awaitedFsNode.primary.nodePath);
                                await dispatch(batchThunk)
                            }else {console.log("Filtered out the folder",awaitedFsNode.primary.nodePath);}
                        }else {
                            await dispatch(batchThunk)
                        }
                        queue.push(awaitedFsNode.primary.nodePath);//push the folder to the queue after processing.it may be deferred by the algorithm based on heuristics
                    }
                }
                dispatch(saveNodeCount());
                deferredPaths[currentSearchPath] = false//this is just a cleanup and it wont affect the flow because it has been processed and shifted from the queue so it isnt possible for it to enter the queue and be deferred again
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

        if (searchQuery.length == 0) {
            toast.dismiss("loading");
            dispatch(setSearchResults(null));
            dispatch(setSearchTermination(true));
            return
        }
        const currentPath:string = selectCurrentPath(getState());

        const heavyFolderQueue:string[] = [];
        await dispatch(searchInBreadth(currentPath,searchQuery,heavyFolderQueue,false,startTime));
        const quickSearch = selectQuickSearch(getState());
        if (!quickSearch) {//only run the second search loop in full search mode
            await dispatch(searchInBreadth(currentPath,searchQuery,heavyFolderQueue,true,startTime));
        }
        const forceTermination:boolean = selectSearchTermination(getState());
        if (!(quickSearch) && !(forceTermination)) {
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
        if (!forceTermination) {//only run this if the user didsnt forcefully terminate the search as the search termination check in the search in breadth function already does this when the user terminates the search midway
            console.log("REGULAR SEARCH TERMINATION");
            searchTime(startTime);
            dispatch(setSearchTermination(true));
            dispatch(clearNodeCount());
        }
    }
}
function searchTime(startTime:number) {
    const endTime = performance.now();
    const timeInMs = endTime - startTime;
    const timeInSeconds = (timeInMs / 1000).toFixed(3);
    toast.dismiss();
    toast.success(`Done searching in ${timeInSeconds} seconds`,{...toastConfig,autoClose:500,transition:Flip,position:"bottom-right"});
}
export function terminateSearch():AppThunk {
    return (dispatch)=>{
        dispatch(setSearchTermination(true))
        toast.dismiss();
        toast.info("Search terminated",{...toastConfig,autoClose:500,transition:Flip});
    }
}
//^SMART RELOADING RELATED
export function watchHomeTabs():AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("CALLED FILE WATCHER");
        dispatch(setFsNodes([]))
        dispatch(setLoadingMessage("loading"))
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
export function openFile(fsNode:FsNode):AppThunk {
    return (dispatch)=>{
        dispatch(setCurrentPath(fsNode.primary.nodePath))
        dispatch(setOpenedFile(fsNode))
    }
}
export function cancelFile():AppThunk {
    return (dispatch)=>{
        dispatch(setOpenedFile(null));
        dispatch(openParentInApp())
    }
}

