import { useEffect, useState,useMemo, ChangeEvent} from "react";
import { useAppDispatch,selector} from "../../../redux/hooks"
import { openParentInApp,selectCurrentPath,selectTabNames,searchFile,loading_toastConfig,toastConfig} from "../../../redux/processingSlice"
import {v4 as uniqueID} from "uuid"
import { toast } from "react-toastify";
import { KeyboardEvent } from "react";


export default function UpperTop() {
    const dispatch = useAppDispatch();
    const currentPath:string = selector(store=>selectCurrentPath(store));
    const [breadCrumbs,setBreadCrumbs] = useState<string[]>([]);
    const uniqueBreadCrumbs = useMemo(()=>breadCrumbs.map(crumb=>({ id: uniqueID(),crumb:crumb})),[breadCrumbs])
    const tabNames:Set<string> = new Set(selector(store=>selectTabNames(store)))
    const [searchQuery,setSearchQuery] = useState<string>("");

    async function goToParent() {
        await dispatch(await openParentInApp())
    }
    function shouldRenderArrow():boolean {
        const pathName = currentPath.slice(currentPath.lastIndexOf("\\") + 1);
        const inRecent:boolean = ((breadCrumbs[0] == "Recent") && (breadCrumbs.length == 1))
        if (tabNames.has(pathName) || (pathName == "") || inRecent) {//if its the home path or the other paths from home or if in the recent folder
            return false
        }
        return true
    }
    function getCrumbArrow(crumb:string):string {
        const lastCrumb = breadCrumbs.at(-1);
        if ((crumb !== lastCrumb)) {//the last crumb is an empty space
            return crumb += " >"
        }else {
            return crumb
        }
    }   
    function listenToQuery(event:ChangeEvent<HTMLInputElement>) {
        setSearchQuery(event.target.value)
    }
    async function search(query:string) {
        toast.loading("Loading your search",loading_toastConfig)
        if (query.length == 1) {
            toast.info("Query is too short",{...toastConfig,toastId:"inf"})
            toast.dismiss("loading")
        }else {
            toast.dismiss("inf")
            dispatch(await searchFile(query));
        }
    }
    async function enterSearch(event:KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            await search(searchQuery)
        }
    }
    useEffect(()=>{
        const replacedPath = currentPath.replace(/.*\\AppData\\Roaming\\Microsoft\\Windows\\Recent/,"Recent");
        const breadCrumbs = replacedPath.split("\\");
        setBreadCrumbs(breadCrumbs)
    },[currentPath])  

    useEffect(()=>{
        console.log("Bread crumbs",breadCrumbs);
    },[breadCrumbs])
    return (
        <div className="bg-[#1f1f30] w-full border-b border-[#3a3a3a] shadow-sm h-[60%]">
            <div className="flex items-center gap-5 mt-3">
                <div className="ml-3 mr-6 font-space-regular text-[#cbdbf1]">
                    <h1>File manager</h1>
                </div>
                {shouldRenderArrow()
                    ?<button onClick={goToParent} className="font-bold cursor-pointer absolute left-36">{"<="}</button>
                    :null
                }
                <div className="flex gap-4 bg-[#387ce13a] py-1 px-2 rounded-xl">
                    {uniqueBreadCrumbs.map((uniqueCrumb=>
                        <div key={uniqueCrumb.id}>
                            <h1 className="font-robot-regular">{getCrumbArrow(uniqueCrumb.crumb)}</h1>
                        </div>
                    ))}
                </div>
                <input className="bg-[#5576c852] text-white outline-none py-1 pl-2 rounded-4xl font-robot-light w-64 absolute right-20" value={searchQuery} onChange={(event)=>listenToQuery(event)} onKeyDown={(event)=>enterSearch(event)}  type="text" placeholder="Your search here"/>
            </div>
        </div>
    )
}