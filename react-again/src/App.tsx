import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"
import { useAppDispatch } from "./redux/hooks"
import { useEffect } from "react"
import { openDirFromHome } from "./redux/processingSlice"
import { cacheAheadOfTime } from "./redux/processingSlice"

export default function App() {
    const dispatch = useAppDispatch();
    //only open the home dir after the last one has finished so that it can check if the ahead of time caching succeeded or not
    useEffect(()=>{
        openDirFromHome("Home").then(thunk=>dispatch(thunk));
        cacheAheadOfTime("Downloads").then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Desktop").then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Pictures").then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Videos").then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Documents").then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Music").then((thunk)=>dispatch(thunk))
    },[dispatch])

    return (
        <div className="flex flex-col h-[100vh] w-[100vw] bg-[#1f1f30] text-white">
            <Toasts/>
            <Top/>
            <div className="flex w-full h-full items-center overflow-hidden">
                <Sidebar/>  
                <Body/>
            </div>
        </div>
    )
}