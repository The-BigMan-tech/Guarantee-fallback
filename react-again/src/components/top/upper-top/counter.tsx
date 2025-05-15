import { selectNodeCount,NodeCount } from "../../../redux/processingSlice";
import { selector } from "../../../redux/hooks";
import { useEffect, useState } from "react";
import {v4 as uniqueID} from 'uuid'

export default function Counter() {
    const nodeCount:NodeCount = selector(store=>selectNodeCount(store));
    const [progress,setProgress] = useState<{id:string,data:NodeCount}[]>([]);

    function truncateStart(str:string, maxLength:number) {
        if (str.length <= maxLength) {
            return str; 
        }
        return '...' + str.slice(str.length - (maxLength - 3));
    }

    useEffect(()=>{
        if (nodeCount.save) {
            console.log("NODE COUNT LENGTH IS ZERO");
            setProgress(prev=>{
                if (prev.length > 6) {
                    prev.length = 0
                }
                return [...prev,{id:uniqueID(),data:nodeCount}]
            });
        }
        if (nodeCount.path === null) {//each time the node count clears which is on each recursion,reset
            setProgress([])
        }
    },[nodeCount])

    useEffect(()=>{
        console.log("NODE PROGRESS: ",progress);
    },[progress])
    return (
        <div className="flex flex-col absolute right-20 top-24">
            {progress[0]?.data.path//this repaired a symptom not a bug so you gotta fix it.Its to conditionally render this omly when progress is set
                ?<>
                    {progress.map((node)=>
                        <div key={node.id} className="flex flex-col mb-4">
                            <div className="flex items-center">
                                <h1 className="text-[#8cb2eb] text-sm font-robot-regular font-semibold">Crawled the path:</h1>
                                <h1 className="text-[#7b9ce9] font-[Consolas]">{truncateStart(node.data.path || "",40)}</h1>
                            </div>
                        </div>
                    )}
                </>
                :null
            }
        </div>
    )
}