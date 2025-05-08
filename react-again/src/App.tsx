import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"
import { selector, useAppDispatch } from "./redux/hooks"
import { useEffect } from "react"
import { openDirFromHome, selectAheadCachingState ,cacheAheadOfTime} from "./redux/processingSlice"

export default function App() {
    const dispatch = useAppDispatch();
    const aotCacheState = selector(store=>selectAheadCachingState(store));

    function unFreezeStartup():string {
        return (aotCacheState == "success")?"":"opacity-30"
    }
    //only open the home dir after the last one has finished so that it can check if the ahead of time caching succeeded or not
    useEffect(()=>{
        openDirFromHome("Home").then(thunk=>dispatch(thunk));
        cacheAheadOfTime("Downloads",false).then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Desktop",false).then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Pictures",false).then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Videos",false).then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Documents",false).then((thunk)=>dispatch(thunk))
        cacheAheadOfTime("Music",true).then((thunk)=>dispatch(thunk))
    },[dispatch])
    return (
        <div className="flex flex-col h-[100vh] w-[100vw] bg-[#1f1f30] text-white">
            <Toasts/>
            <Top {...{unFreezeStartup}}/>
            <div className="flex w-full h-full items-center overflow-hidden">
                <Sidebar {...{unFreezeStartup}}/>  
                <Body/>
            </div>
        </div>
    )
}