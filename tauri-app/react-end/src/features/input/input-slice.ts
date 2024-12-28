import { createSlice,PayloadAction} from "@reduxjs/toolkit";
import { RootState } from "../../store";

export interface Calculation {
    input:string,
    result:number
}
const initState:Calculation = {
    input:'',
    result:0
}
const inputSlice = createSlice({
    name:'input',
    initialState:initState,
    reducers:{
        display(state,action:PayloadAction<string>):void {
            state.input = action.payload
        }
    }
})
export default inputSlice.reducer
export const {display} = inputSlice.actions
export const selectInput = (store:RootState):string => store.input.input