import { createSlice,PayloadAction} from '@reduxjs/toolkit'

export interface CounterSliceState {
    value:number
}
const initialState:CounterSliceState = {
    value:0
}
export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment(state,action:PayloadAction<number>):void {
            state.value += action.payload
        }
    }
})
// Action creators are generated for each case reducer function
export const {increment} = counterSlice.actions
export default counterSlice.reducer