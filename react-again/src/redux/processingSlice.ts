import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'
import { FsResult,readDirectory,File} from '../utils/fileOperations';

type SortingOrder = 'name' | 'date' | 'type' | 'size';
type View = 'xl' | 'l' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content';

export interface processingSliceState {
    currentPath:string,
    tabs:string[],
    files:File[] | null,
    selectedFiles:File[] | null,
    error:string | null,
    searchQuery:string | null,
    isLoading:boolean,
    sortBy:SortingOrder,
    viewBy:View,
    showDetailsPane:boolean
}
const initialState:processingSliceState = {
    currentPath:"",
    tabs:['Document','Images','Audios','Desktop','RecycleBin','Recent'],
    files:null,
    selectedFiles:null,
    error:null,
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
        setFiles(state,action:PayloadAction<File[]>) {
            state.files = action.payload
        },
        setError(state,action:PayloadAction<string>) {
            state.error = action.payload
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
export const {setCurrentPath,setFiles,setError,setSearchQuery,setIsLoading,setSortBy,setView,setShowDetails} = processingSlice.actions;

export const selectCurrentPath = (store:RootState):string => store.processing.currentPath;
export const selectFiles = (store:RootState):File[] | null => store.processing.files;
export const selectSelectedFiles = (store:RootState):File[] | null => store.processing.selectedFiles;
export const selectError = (store:RootState):string | null => store.processing.error
export const selectSearchQuery = (store:RootState):string | null => store.processing.searchQuery;
export const selectIsLoading = (store:RootState):boolean => store.processing.isLoading;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;

export async function openDirectory(filepath:string):Promise<AppThunk> {
    return async (dispatch,) => {
        const filesResult:FsResult<File[] | Error | null> = await readDirectory(filepath);
        if (filesResult.value instanceof Error) {
            console.log(`Error occured while reading from the dir: ${filepath}: `,filesResult.value.message);
        }else if (filesResult.value == null) {
            console.log("Directory exists but there are no files in it");
        }else {
            const files:File[] = filesResult.value
            dispatch(setFiles(files))
            console.log("Files:",files);
        }
        dispatch(setCurrentPath(filepath));
    }
}

