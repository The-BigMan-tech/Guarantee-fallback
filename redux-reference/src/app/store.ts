import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/Body/body-slice'

const store = configureStore({
    reducer:{
        counter:counterReducer
    }
})
export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store