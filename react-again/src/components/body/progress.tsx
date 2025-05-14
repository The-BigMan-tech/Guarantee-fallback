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
        <div className="flex flex-col bg-[#141428] w-[20%]">
            <h1>Hello progress</h1>
        </div>
    )
}