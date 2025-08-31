//^WARNING!!!!
//!This project is no longer maintained for security reasons.
//!The frontend code is SAFE and can still be reused
//!But all file system operations code in the rust end has been removed.
//!DONT ATTEMPT TO RUN THIS APP UNLESS IN AN ISOLATED ENVIRONMENT.
//!ONLY REUSE THE COMPONENTS THAT YOU NEED.

import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"
import { selector, useAppDispatch } from "./redux/hooks"
import { useEffect } from "react"
import { openDirFromHome ,watchHomeTabs} from "./redux/thunks/open-dir-related"
import { loadCache } from "./redux/thunks/ui-cache-related"
import { cacheHomeTab } from "./redux/thunks/open-dir-related"
import { selectFreezeBars } from "./redux/selectors"

export default function App() {
    const dispatch = useAppDispatch();
    const freezeBars = selector(store=>selectFreezeBars(store))

    function unFreezeStartup():string {//the empty quote means its unfrozen because it doesnt affect opacity 
        return (freezeBars)?"opacity-30":""
    }
    //only open the home dir after the last one has finished so that it can check if the ahead of time caching succeeded or not
    useEffect(()=>{//everything here except for opening the home on startup is an optimization.
        dispatch(loadCache());
        dispatch(watchHomeTabs());
        dispatch(cacheHomeTab("Recent",true))//i set this one to true because its not being watched for validation so reusing the entry saves time and can display something since its going to be invalidated anyway
        dispatch(cacheHomeTab("Downloads",false));//i set the rest to false so that they update with the latest data and remain valid to prevemt reloads since they are being watched for validation
        dispatch(cacheHomeTab("Desktop",false))
        dispatch(cacheHomeTab("Pictures",false))
        dispatch(cacheHomeTab("Videos",false))
        dispatch(cacheHomeTab("Documents",false))
        dispatch(cacheHomeTab("Music",false))
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