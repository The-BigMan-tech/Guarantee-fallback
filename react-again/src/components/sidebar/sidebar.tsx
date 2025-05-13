import { selectTabNames,UniqueTab,openDirFromHome,loading_toastConfig, selectSearchTermination} from "../../redux/processingSlice"
import { selector ,useAppDispatch} from "../../redux/hooks"
import {v4 as uniqueID} from 'uuid'
import { useState,useMemo } from "react";
import { Card } from "./card";
import { toast } from "react-toastify";


export default function Sidebar({unFreezeStartup}:{unFreezeStartup:()=>string}) {
    const dispatch = useAppDispatch();
    const tabNames:string[] = selector((store)=>selectTabNames(store));
    const uniqueTabs: UniqueTab[] = useMemo(() => tabNames.map(tabName=>({ id: uniqueID(), name: tabName })), [tabNames]);
    const tabImgs:Record<string,string> = {Desktop:"desktop.svg",Downloads:"download.svg",Documents:"book.svg",Pictures:"image.svg",Music:"headphones.svg",Videos:"video.svg",RecycleBin:"trash.svg"};
    const shouldTerminateSearch:boolean = selector(store=>selectSearchTermination(store))

    const [recentTabId,] = useState(uniqueID());
    const [homeTabId,] = useState(uniqueID());
    const [clickedTab,setClickedTab] = useState<string>(homeTabId);

    async function clickTab(tabId:string,tabName:string):Promise<void> {
        if ((unFreezeStartup() !== "opacity-30") && (shouldTerminateSearch)) {
            toast.loading(`Loading the folder ${tabName}`,{...loading_toastConfig,position:"top-right",toastId:"loading-sidebar"});
            setClickedTab(tabId)
            await dispatch(openDirFromHome(tabName));
        }
    }
    function freezeOnSearch() {
        if (shouldTerminateSearch) {
            return ""
        }else {
            return "opacity-30"
        }
    }
    function clickedClass(tabId:string):string {
        return (clickedTab === tabId)?"bg-[#387de4fa] shadow-md rounded-3xl py-2 w-[90%] font-robot-regular":"py-3.5 w-[30%] font-sans "
    }
    return (
        <div className={`flex flex-col bg-[#1f1f30] h-[100%] w-[12%] border-r border-[#3a3a3a] ${unFreezeStartup()} ${freezeOnSearch()}`}>
            <div className="flex flex-col mt-10">
                <div>
                    <Card {...{id:homeTabId,tabName:"Home",imgName:"house.svg",clickedTab,clickTab,clickedClass,unFreezeStartup}}/>
                    <Card {...{id:recentTabId,tabName:"Recent",imgName:"clock.svg",clickedTab,clickTab,clickedClass,unFreezeStartup}}/>
                </div>
                <div className="border-t mt-4 pt-4 border-[#3a3a3a]">
                    {uniqueTabs.map(tab=>
                    <div key={tab.id}>
                        <Card {...{id:tab.id,tabName:tab.name,imgName:tabImgs[tab.name],clickedTab,clickTab,clickedClass,unFreezeStartup}}/>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}