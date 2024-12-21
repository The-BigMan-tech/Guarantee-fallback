import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { RootState } from '@/app/store'

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
export default counterSlice.reducer
export const {increment} = counterSlice.actions

export function selectCountFrom(state:RootState):number {
    return state.counter.value
}

export const incrementIfOdd = (amount: number): AppThunk => {
    return (dispatch, getState) => {
        const currentValue = selectCountFrom(getState())
        if (currentValue % 2 === 1) {
            dispatch(increment(amount))
        }
    }
}