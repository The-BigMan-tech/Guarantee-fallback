import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home} from '../utils/rust-fs-interface';
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
    searchQuery:string | null,//for storing the search query
    isLoading:boolean,//stating whether the app is loading while its doing an app operation
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
    searchQuery:null,
    isLoading:false,
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
        setSearchQuery(state,action:PayloadAction<string>) {
            state.searchQuery = action.payload
        },
        setIsLoading(state,action:PayloadAction<boolean>) {
            state.isLoading = action.payload
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
export const {setCurrentPath,setFsNodes,setError,setNotice,setSearchQuery,setIsLoading,setSortBy,setView,setShowDetails} = processingSlice.actions;
export const selectCurrentPath = (store:RootState):string => store.processing.currentPath;
export const selectTabNames = (store:RootState):string[] => store.processing.tabNames;
export const selectFsNodes = (store:RootState):FsNode[] | null => store.processing.fsNodes;
export const selectSelectedFsNodes = (store:RootState):FsNode[] | null => store.processing.selectedFsNodes;
export const selectError = (store:RootState):Message => store.processing.error;
export const selectNotice = (store:RootState):Message => store.processing.notice;
export const selectSearchQuery = (store:RootState):string | null => store.processing.searchQuery;
export const selectIsLoading = (store:RootState):boolean => store.processing.isLoading;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;


export function setLoadingConditionally(isLoading:boolean):AppThunk {
    return (dispatch,getState)=>{
        const prev_isLoading:boolean = selectIsLoading(getState())
        if (prev_isLoading !== isLoading) {
            dispatch(setIsLoading(isLoading))
        }
    }
}
//the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        dispatch(setIsLoading(true))
        const dirResult:FsResult<FsNode[] | Error | null> = await readDirectory(folderPath);
        if (dirResult.value instanceof Error) {
            dispatch(setError(`This error:${dirResult.value.message} occured at the dir: ${folderPath}`))
        }else if (dirResult.value == null) {
            dispatch(setNotice(`The following directory is empty: ${folderPath}`));
        }else {
            const fsNodes:FsNode[] = dirResult.value
            dispatch(setFsNodes(fsNodes));
            dispatch(setCurrentPath(folderPath));
            dispatch(setIsLoading(false));
            console.log("Files:",fsNodes);
        }
    }
}
export async function returnFileContent(filePath:string):Promise<AppThunk> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        dispatch(setIsLoading(true))
        const contentResult:FsResult<string | Error | null>  = await readFile(filePath);
        if (contentResult.value instanceof Error) {
            dispatch(setError(`This error occurred: ${contentResult.value.message} when reading the file: ${filePath}`))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice(`The following file is empty: ${filePath}`))
            return null;
        }else {
            dispatch(setIsLoading(false))
            return contentResult.value
        }
    }
}
export async function openDirectoryFromHome(tabName:string):Promise<AppThunk> {
    return async (dispatch)=> {
        // dispatch(setError(`testing the error at tab ${tabName}`))
        dispatch(setIsLoading(true))
        if (tabName == "Recent") return;
        const folderPath:string = await join_with_home((tabName == "Home")?"":tabName)
        openDirectoryInApp(folderPath)
        dispatch(setIsLoading(false))
    }
}
