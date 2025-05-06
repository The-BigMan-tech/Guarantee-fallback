import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,readFile,FsNode,join_with_home} from '../utils/rust-fs-interface';

type SortingOrder = 'name' | 'date' | 'type' | 'size';
type View = 'xl' | 'l' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content';

export interface UniqueTab {
    id:string,
    name:string
}
export interface processingSliceState {
    currentPath:string,
    tabNames:string[],
    fsNodes:FsNode[] | null,
    selectedFsNodes:FsNode[] | null,
    error:string | null,
    notice:string | null,
    searchQuery:string | null,
    isLoading:boolean,
    sortBy:SortingOrder,
    viewBy:View,
    showDetailsPane:boolean
}
const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos','RecycleBin'],
    fsNodes:null,
    selectedFsNodes:null,
    error:null,
    notice:null,
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
            state.error = action.payload
        },
        setNotice(state,action:PayloadAction<string>) {
            state.notice = action.payload
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
export const selectError = (store:RootState):string | null => store.processing.error;
export const selectNotice = (store:RootState):string | null => store.processing.notice;
export const selectSearchQuery = (store:RootState):string | null => store.processing.searchQuery;
export const selectIsLoading = (store:RootState):boolean => store.processing.isLoading;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;

//*the file nodes in the directory dont have their contents loaded for speed and easy debugging.if you want to read the content,you have to use returnFileWithContent to return a copy of the file node with its content read
export async function openDirectoryInApp(folderPath:string):Promise<AppThunk> {//Each file in the directory is currently unread
    return async (dispatch):Promise<void> =>{
        const dirResult:FsResult<FsNode[] | Error | null> = await readDirectory(folderPath);
        if (dirResult.value instanceof Error) {
            dispatch(setError(dirResult.value.message))
        }else if (dirResult.value == null) {
            dispatch(setNotice("Directory is empty"));
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
            dispatch(setError(contentResult.value.message))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice("File is empty"))
            return null;
        }else {
            return contentResult.value
        }
    }
}
export async function openDirectoryFromHome(tabName:string):Promise<AppThunk> {
    return async ()=> {
        if (tabName == "Recent") return;
        const folderPath:string = await join_with_home((tabName == "Home")?"":tabName)
        openDirectoryInApp(folderPath)
    }
}
