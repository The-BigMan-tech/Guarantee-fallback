import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState } from '@/app/store'
import { AppThunk } from '@/app/store'
import { createAsyncThunk } from '@reduxjs/toolkit'

export interface CounterSliceState {
    value:number,
    loading:boolean
    error:string
    items:unknown
}
const initialState:CounterSliceState = {
    value:0,
    loading:false,
    error:''
}
export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment(state,action:PayloadAction<number>):void {
            state.value += action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchItems.pending, (state) => {
                state.loading = true;
                state.error = 'No error';
            })
            .addCase(fetchItems.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload; // store the fetched data
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message as string; // handle error
            });
    },
})
export default counterSlice.reducer
export const {increment} = counterSlice.actions
export const selectCountFrom = (store:RootState):number => store.counter.value


export function incrementIfOdd(amount:number): AppThunk {
    return (dispatch, getState) => {
        const currentCount:number = selectCountFrom(getState())
        if (currentCount == 12) {
            console.log('TRUE:',currentCount);
            dispatch(increment(amount))
        }
    }
}
export const fetchItems = createAsyncThunk('counter/fetchItems',
    async (itemId: string) => {
        const item = await fetch(itemId)
        return item
    }
)