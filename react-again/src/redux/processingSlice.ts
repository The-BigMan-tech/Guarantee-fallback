import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home,base_name} from '../utils/rust-fs-interface';
import {v4 as uniqueID} from 'uuid';


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
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos','RecycleBin'],
    fsNodes:null,
    cache:[],
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
        pushToCache(state,action:PayloadAction<CachedFolder>) {
            state.cache.push(action.payload)
        },
        replaceInCache(state,action:PayloadAction<{index:number,data:CachedFolder}>) {
            state.cache[action.payload.index] = action.payload.data
        },
        shiftCache(state) {
            state.cache.shift()
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
    pushToCache,
    replaceInCache,
    shiftCache,
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
        if (existingCacheIndex !== -1) {
            console.log(data.path,"Cache already exists at index",existingCacheIndex);
            dispatch(replaceInCache({index:existingCacheIndex,data}))
        }else {
            if ((appCache.length+1) > 10) {
                console.log("Cache length is greater than 3");
                dispatch(shiftCache())
            }
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
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        console.log("Folder path for cached",folderPath);
        //[] array means its loading not that its empty
        dispatch(setFsNodes([]))//ensures that clicking on another tab wont show the previous one while loading to not look laggy
        dispatch(openCachedDirInApp(folderPath));//opens the cached dir in app in the meantime if any
        dispatch(setCurrentPath(folderPath));//since the cached part is opened,then we can do this.

        const folderName = await base_name(folderPath);
        dispatch(setLoadingMessage(`Loading the folder: ${(folderName=="USER")?"Home":folderName}`))
        const dirResult:FsResult<FsNode[] | Error | null> = await readDirectory(folderPath);//its fast because it doesnt load the file content

        if (dirResult.value instanceof Error) {
            dispatch(setFsNodes(null))//to ensure that they dont interact with an unstable folder in the ui
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`));
        }else if (dirResult.value == null) {
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
            dispatch(setFsNodes(null))//null fs nodes then means its empty
        }else {
            const fsNodes:FsNode[] = dirResult.value
            dispatch(setFsNodes(fsNodes));//opens the loaded dir as soon its done being processed
            dispatch(setLoadingMessage(`Done loading: ${folderName}`));
            dispatch(addToCache({path:folderPath,data:fsNodes}));//performs caching while the user can interact with the dir in the app
            console.log("Files:",fsNodes);
        }
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
        if (tabName == "Recent") return;
        const folderPath:string = await join_with_home((tabName == "Home")?"":tabName)
        dispatch(await openDirectoryInApp(folderPath))
    }
}
