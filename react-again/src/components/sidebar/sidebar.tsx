import { selectTabNames,UniqueTab,changeDirectory} from "../../redux/processingSlice"
import { selector ,useAppDispatch} from "../../redux/hooks"
import {v4 as uniqueID} from 'uuid'
import { useState,useMemo } from "react";

export default function Sidebar() {
    const dispatch = useAppDispatch();
    const tabNames:string[] = selector((store)=>selectTabNames(store));
    const uniqueTabs: UniqueTab[] = useMemo(() => tabNames.map(tabName=>({ id: uniqueID(), name: tabName })), [tabNames]);
    const tabImgs:Record<string,string> = {Recent:"clock.svg",Desktop:"desktop.svg",Downloads:"download.svg",Documents:"book.svg",Images:"image.svg",Audios:"headphones.svg",Videos:"video.svg",RecycleBin:"trash.svg"};
    const [clickedTab,setClickedTab] = useState<string>('')
    async function clickTab(tabId:string,tabName:string):Promise<void> {
        setClickedTab(tabId)
        dispatch(await changeDirectory(tabName));
    }
    function clickedClass(tabId:string):string {
        return (clickedTab === tabId)?"border border-gray-500 rounded-r-2xl bg-[#bccfe93c]":""
    }
    return (
        <div className="flex flex-col bg-[#282a4a] h-[98%] w-[22%] border-r-2 border-slate-400">
            <div className="border-b-2 border-slate-400 h-[9.5%] content-center flex items-center gap-4">
                <img className="w-10 ml-6" src="./assets/folder(1).png" alt="" />
                <h1 className="font-space-regular font-bold text-[#7f9ee8] text-lg">Files</h1>
            </div>
            <div className="flex flex-col gap-4 mt-6">
                {uniqueTabs.map(tab=>
                    <div key={tab.id}>
                        <button onClick={async ()=>await clickTab(tab.id,tab.name)} className={`flex items-center cursor-pointer py-2.5 w-52 text-left pl-8 hover:border hover:border-slate-400 rounded-r-2xl ${clickedClass(tab.id)}`}>
                            <img className="w-4 relative right-4 shrink-0" src={`./assets/${tabImgs[tab.name]}`} alt="" />
                            <h1 className="font-robot-regular text-sm">{tab.name}</h1>
                        </button>
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 left-3">
                <img className="w-32" src="./assets/pencil-folder.png" alt="" />
            </div>
        </div>
    )
}