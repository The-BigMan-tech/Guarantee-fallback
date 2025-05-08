import { Action, configureStore } from '@reduxjs/toolkit'
import processingReducer from './processingSlice'
import { ThunkAction } from '@reduxjs/toolkit'


const store = configureStore({
    reducer:{
        processing:processingReducer,
    }})
export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action
>;