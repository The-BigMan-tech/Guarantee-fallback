import { selectQuickSearch,selectNodeCount,selectSearchTermination,NodeCount } from "../../../redux/processingSlice";
import { selector } from "../../../redux/hooks";
import { useEffect, useState } from "react";
import {v4 as uniqueID} from 'uuid'

export default function Counter() {
    const quickSearch:boolean = selector(store=>selectQuickSearch(store));
    const nodeCount:NodeCount = selector(store=>selectNodeCount(store));
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));
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
        //this is fragile
        if ((nodeCount.items === null ) && (nodeCount.path === null)) {//each time the node count clears which is on each recursion,reset
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
                            <div>
                                <h1 className="font-bold text-[#7db8f1] text-sm">Searching:</h1>
                                <h1 className="text-gray-400">{truncateStart(node.data.path || "",40)}</h1>
                            </div>
                            <progress className="daisy-progress daisy-progress-success w-56 rounded-2xl" value={node.data.items || 0} max={node.data.totalItems || 0}></progress>
                        </div>
                    )}
                </>
                :null
            }
            {/* {(!(quickSearch) && !(isSearchTerminated))
                ?<h1>Searched: {nodeCount.items} / {nodeCount.totalItems} items</h1>
                :null
            } */}
        </div>
    )
}