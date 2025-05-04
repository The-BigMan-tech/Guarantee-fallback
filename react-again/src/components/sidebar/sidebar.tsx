import { selectTabs,UniqueTab} from "../../redux/processingSlice"
import { selector } from "../../redux/hooks"
import {v4 as uniqueID} from 'uuid'
import { useState,useMemo } from "react";

export default function Sidebar() {
    const tabs:string[] = selector((store)=>selectTabs(store));
    const uniqueTabs: UniqueTab[] = useMemo(() => tabs.map(tab=>({ id: uniqueID(), name: tab })), [tabs]);
    const [clickedTab,setClickedTab] = useState<string>('')
    function clickTab(tabId:string):void {
        setClickedTab(tabId)
    }
    function clickedClass(tabId:string):string {
        return (clickedTab === tabId)?"border border-gray-500 rounded-r-2xl":""
    }
    return (
        <div className="flex flex-col bg-[#282a4a] h-[98%] w-[22%] border-r-2 border-slate-400">
            <div className="border-b-2 border-slate-400 h-[9.5%] content-center">
                <h1 className="relative left-8 font-space-regular font-bold text-[#a3bae6] text-lg">File manager</h1>
            </div>
            <div className="flex flex-col gap-4 mt-10">
                {uniqueTabs.map(tab=>
                    <div key={tab.id}>
                        <button onClick={()=>clickTab(tab.id)} className={`cursor-pointer py-3 w-52 text-left pl-8 ${clickedClass(tab.id)}`}>{tab.name}</button>
                    </div>
                )}
            </div>
            <div className="absolute bottom-3 left-3">
                <img className="w-36" src="./assets/pencil-folder.png" alt="" />
            </div>
        </div>
    )
}