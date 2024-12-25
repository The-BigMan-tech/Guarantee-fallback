import { createSlice,PayloadAction,createAction} from '@reduxjs/toolkit'
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
    error:'',
    items:null
}
export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment(state,action:PayloadAction<number>):void {
            console.log('reached Incremented function');
            state.value += action.payload || 1
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchItems.pending,state => {
                state.loading = true;
                state.error = 'No error';
            })
            .addCase(fetchItems.fulfilled,(state, action) => {
                state.loading = false;
                state.items = action.payload; // store the fetched data
            })
            .addCase(fetchItems.rejected,state => {
                state.loading = false;
                state.error = 'Error.No item could be found'; // handle error
            });
    },
})
export default counterSlice.reducer
export const {} = counterSlice.actions
export const increment = createAction<number | undefined>('counter/increment')

export const selectCountFrom = (store:RootState):number => store.counter.value;
export const selectLoadingFrom = (store:RootState):boolean => store.counter.loading

export function incrementIfOdd(amount:number): AppThunk {
    return (dispatch,getState) => {
        const currentCount:number = selectCountFrom(getState())
        if (currentCount == 12) {
            console.log('TRUE:',currentCount);
            dispatch(increment(amount))
        }
    }
}
export const fetchItems = createAsyncThunk('counter/fetchItems',
    async (itemId: string):Promise<string> => {
        const response:Response = await fetch(itemId)
        return await response.json()
    }
)