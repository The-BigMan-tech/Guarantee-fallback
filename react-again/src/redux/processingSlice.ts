import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState } from './store'

export interface processingSliceState {
    value:number
}
const initialState:processingSliceState = {
    value:0
}
export const processingSlice = createSlice({
    name: 'processing',
    initialState,
    reducers: {
        increment(state,action:PayloadAction<number | undefined>):void {
            state.value += action?.payload || 1
        },
        decrement(state,action:PayloadAction<number | undefined>):void {
            state.value -= action?.payload || 1
        }
    },
})
export default processingSlice.reducer
export const {increment,decrement} = processingSlice.actions
export const selectValueFrom = (store:RootState):number => store.processing.value;