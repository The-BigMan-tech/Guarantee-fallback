import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"
import { selector, useAppDispatch } from "./redux/hooks"
import { useEffect } from "react"
import { openDirFromHome, selectAheadCachingState ,cacheAheadOfTime,loadCache,watchHomeTabs} from "./redux/processingSlice"

export default function App() {
    const dispatch = useAppDispatch();
    const aotCacheState = selector(store=>selectAheadCachingState(store));

    function unFreezeStartup():string {//the empty quote means its unfrozen because it doesnt affect opacity 
        return (aotCacheState == "success")?"":"opacity-30"
    }
    //only open the home dir after the last one has finished so that it can check if the ahead of time caching succeeded or not
    useEffect(()=>{//everything here except for opening the home on startup is an optimization.
        dispatch(loadCache());
        dispatch(watchHomeTabs());
        dispatch(cacheAheadOfTime("Recent",false,true))
        dispatch(cacheAheadOfTime("Downloads",false,true));
        dispatch(cacheAheadOfTime("Desktop",false,true))
        dispatch(cacheAheadOfTime("Pictures",false,true))
        dispatch(cacheAheadOfTime("Videos",false,true))
        dispatch(cacheAheadOfTime("Documents",false,true))
        dispatch(cacheAheadOfTime("Music",true,true))
        dispatch(openDirFromHome("Home"))//it will cache the home tab ahead of time after loading
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