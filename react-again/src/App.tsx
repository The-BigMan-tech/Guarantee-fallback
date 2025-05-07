import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"
import { useAppDispatch } from "./redux/hooks"
import { useEffect } from "react"
import { openDirFromHome } from "./redux/processingSlice"
import { cacheAheadOfTime } from "./redux/processingSlice"
import { AppThunk } from "./redux/store"

export default function App() {
    const dispatch = useAppDispatch();
    //only open the home dir after the last one has finished so that it can check if the ahead of time caching succeeded or not
    useEffect(()=>{
        const aotCachePromise:Promise<AppThunk>[] = [];
        aotCachePromise.push(cacheAheadOfTime("Downloads"));
        aotCachePromise.push(cacheAheadOfTime("Desktop"));
        aotCachePromise.push(cacheAheadOfTime("Pictures"));
        aotCachePromise.push(cacheAheadOfTime("Videos"));
        aotCachePromise.push(cacheAheadOfTime("Documents"));
        aotCachePromise.push(cacheAheadOfTime("Music"));
        Promise.all(aotCachePromise).then((thunks)=> {
            thunks.forEach(thunk=>dispatch(thunk));
            openDirFromHome("Home").then(thunk=>dispatch(thunk))
        })
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