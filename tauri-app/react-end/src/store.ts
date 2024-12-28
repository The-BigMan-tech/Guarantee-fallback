import { Action, configureStore } from '@reduxjs/toolkit'
import { ThunkAction } from '@reduxjs/toolkit'
import inputReducer from './features/input/input-slice'

const store = configureStore({
    reducer:{
        input:inputReducer
    },
})
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