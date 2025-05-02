import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState,AppThunk } from './store'

export interface processingSliceState {
    currentPath:string,
    files:File[] | null,
    selectedFiles:File[] | null,
    error:string | null,
    searchQuery:string | null,
    isLoading:boolean,
    sortBy:'name' | 'date' | 'type' | 'size',
    viewBy:'xl' | 'l' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content'
    showDetailsPane:boolean
}
const initialState:processingSliceState = {
    currentPath:process.cwd(),
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
        
    },
})
export default processingSlice.reducer
// export const {} = processingSlice.actions
// export const selectValueFrom = (store:RootState):number => store.processing.value;

// export function incrementIfOdd(amount:number): AppThunk {
//     return (dispatch,getState) => {
//         const currentValue:number = selectValueFrom(getState())
//         if (currentValue == 12) {
//             console.log('TRUE:',currentValue);
//             dispatch(increment(amount))
//         }
//     }
// }