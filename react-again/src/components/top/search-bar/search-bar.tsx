import { useEffect, useState,useMemo} from "react";
import { useAppDispatch,selector} from "../../../redux/hooks"
import { openParentInApp,selectCurrentPath,selectTabNames} from "../../../redux/processingSlice"
import {v4 as uniqueID} from "uuid"

export default function SearchBar() {
    const dispatch = useAppDispatch();
    const currentPath:string = selector(store=>selectCurrentPath(store));
    const [breadCrumbs,setBreadCrumbs] = useState<string[]>([]);
    const uniqueBreadCrumbs = useMemo(()=>breadCrumbs.map(crumb=>({ id: uniqueID(),crumb:crumb})),[breadCrumbs])
    const tabNames:Set<string> = new Set(selector(store=>selectTabNames(store)))
    async function goToParent() {
        await dispatch(await openParentInApp())
    }
    function shouldRenderArrow():boolean {
        const pathName = currentPath.slice(currentPath.lastIndexOf("\\") + 1);
        if (tabNames.has(pathName) || (pathName == "")) {
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
    useEffect(()=>{
        if (currentPath.endsWith("AppData\\Roaming\\Microsoft\\Windows\\Recent")) {
            setBreadCrumbs(["Recent"])
        }else {
            setBreadCrumbs(currentPath.split("\\"))
        }
    },[currentPath])  
    useEffect(()=>{
        console.log("Bread crumbs",breadCrumbs);
    },[breadCrumbs])
    return (
        <div className="bg-[#1f1f30] w-full border-b border-[#3a3a3a] shadow-sm h-[60%]">
            <div className="flex items-center gap-5">
                {shouldRenderArrow()
                    ?<button onClick={goToParent} className="font-bold cursor-pointer absolute left-10">{"<="}</button>
                    :null
                }
                <div className="flex gap-4 ml-40 mt-3">
                    {uniqueBreadCrumbs.map((uniqueCrumb=>
                        <div key={uniqueCrumb.id}>
                            <h1 className="font-space-regular">{getCrumbArrow(uniqueCrumb.crumb)}</h1>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}