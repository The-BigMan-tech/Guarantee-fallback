import { Action, configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/Body/body-slice'
import { ThunkAction } from '@reduxjs/toolkit'
import apiSlice from '../features/api/api-slice'

const store = configureStore({
    reducer:{
        counter:counterReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware:(getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware)
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