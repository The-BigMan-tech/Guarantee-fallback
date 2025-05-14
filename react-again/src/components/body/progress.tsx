import { useEffect, useState } from "react"
import { SearchProgress } from "../../redux/processingSlice"

export default function Progress({searchProgress}:{searchProgress:Record<string,SearchProgress>}) {
    function truncateStart(str:string, maxLength:number) {
        if (str.length <= maxLength) {
            return str; 
        }
        return '...' + str.slice(str.length - (maxLength - 3));
    }

    useEffect(()=>{
        console.log("Search progress",JSON.stringify(searchProgress,null,2));
        console.log("Hello progress component");
    },[searchProgress])
    return (
        <div className="flex flex-col w-[30%] border border-red-400 h-[94%] relative top-3 overflow-y-scroll overflow-x-hidden">
            {Object.entries(searchProgress).length === 0 
                ?<p>No active search progress.</p>
                :<div className="flex flex-col text-sm gap-5 ">
                    {Object.entries(searchProgress).map(([path, progress]) => 
                        <div key={path}>
                            <h1>Current path: {truncateStart(path,20)}</h1>
                            <h1>Progress: {progress.lastThreshold}</h1>
                        </div>
                    )}
                </div>
            }
        </div>
    )
}