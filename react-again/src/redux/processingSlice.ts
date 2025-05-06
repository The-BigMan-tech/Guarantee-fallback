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
export interface processingSliceState {
    currentPath:string,//as breadcrumbs
    tabNames:string[],//home tabs
    fsNodes:FsNode[] | null,//current files loaded
    selectedFsNodes:FsNode[] | null,//for selecting for deleting,copying or pasting
    error:Message//for writing app error
    notice:Message,//for writing app info
    loadingMessage:Message//for loading messages
    searchQuery:string | null,//for storing the search query
    sortBy:SortingOrder,//sorting order of the files
    viewBy:View,//changes the layout of the folder content
    showDetailsPane:boolean//to show extra details like charts or disk usage
}
const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos','RecycleBin'],
    fsNodes:null,
    selectedFsNodes:null,
    error:{id:"",message:null},
    notice:{id:"",message:null},
    loadingMessage:{id:"",message:null},
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
        setFsNodes(state,action:PayloadAction<FsNode[]>) {
            state.fsNodes = action.payload
        },
        setError(state,action:PayloadAction<string>) {
            state.error.id = uniqueID();
            state.error.message = action.payload;
        },
        setNotice(state,action:PayloadAction<string>) {
            state.notice.id = uniqueID();
            state.notice.message = action.payload
        },
        setLoadingMessage(state,action:PayloadAction<string>) {
            state.loadingMessage.id = uniqueID();
            state.loadingMessage.message = action.payload
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
export default processingSlice.reducer;
export const {setCurrentPath,setFsNodes,setError,setNotice,setLoadingMessage,setSearchQuery,setSortBy,setView,setShowDetails} = processingSlice.actions;
export const selectCurrentPath = (store:RootState):string => store.processing.currentPath;
export const selectTabNames = (store:RootState):string[] => store.processing.tabNames;
export const selectFsNodes = (store:RootState):FsNode[] | null => store.processing.fsNodes;
export const selectSelectedFsNodes = (store:RootState):FsNode[] | null => store.processing.selectedFsNodes;
export const selectError = (store:RootState):Message => store.processing.error;
export const selectNotice = (store:RootState):Message => store.processing.notice;
export const selectLoadingMessage = (store:RootState):Message => store.processing.loadingMessage;
export const selectSearchQuery = (store:RootState):string | null => store.processing.searchQuery;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;


//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        dispatch(setLoadingMessage(`Loading the directory: ${await base_name(folderPath)}`))
        const dirResult:FsResult<FsNode[] | Error | null> = await readDirectory(folderPath);
        if (dirResult.value instanceof Error) {
            dispatch(setError(`The error:"${dirResult.value.message}" occured while loading the dir: "${folderPath}"`))
        }else if (dirResult.value == null) {
            dispatch(setNotice(`The following directory is empty: "${folderPath}"`));
        }else {
            const fsNodes:FsNode[] = dirResult.value
            dispatch(setFsNodes(fsNodes));
            dispatch(setCurrentPath(folderPath));
            console.log("Files:",fsNodes);
        }
    }
}
export async function returnFileContent(filePath:string):Promise<AppThunk> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        const contentResult:FsResult<string | Error | null>  = await readFile(filePath);
        if (contentResult.value instanceof Error) {
            dispatch(setError(`The error "${contentResult.value.message}" occured when reading the file: "${filePath}"`))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice(`The following file is empty: ${filePath}`))
            return null;
        }else {
            return contentResult.value
        }
    }
}
export async function openDirectoryFromHome(tabName:string):Promise<AppThunk> {
    return async (dispatch)=> {
        // dispatch(setNotice(`testing the notice at tab ${tabName}`))
        if (tabName == "Recent") return;
        const folderPath:string = await join_with_home((tabName == "Home")?"":tabName)
        dispatch(await openDirectoryInApp(folderPath))
    }
}
