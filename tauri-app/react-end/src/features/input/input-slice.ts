import { createSlice,PayloadAction} from "@reduxjs/toolkit";
import { RootState } from "../../store";

const initState:Record<string,string> = {
    display:'',
}
const inputSlice = createSlice({
    name:'input',
    initialState:initState,
    reducers:{
        display(state,action:PayloadAction<string>):void {
            state.display = action.payload
        }
    }
})
export default inputSlice.reducer
export const {display} = inputSlice.actions
export const selectInput = (store:RootState):string => store.input.display