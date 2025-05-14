import { useEffect } from "react"
import { SearchProgress } from "../../redux/processingSlice"

export default function Progress({searchProgress}:{searchProgress:Record<string,SearchProgress>}) {
    useEffect(()=>{
        console.log("Hello progress component");
    },[])
    return (
        <div className="flex flex-col w-[20%]">
            <h1>Hello progress</h1>
        </div>
    )
}