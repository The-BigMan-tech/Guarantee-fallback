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
                if (prev.length > 7) {
                    prev.length = 0
                }
                return [...prev,{id:uniqueID(),data:nodeCount}]
            });
        }
        if ((nodeCount.totalItems === null ) && (nodeCount.items === null)) {//each time the node count clears which is on each recursion,reset
            setProgress([])
        }
    },[nodeCount])

    useEffect(()=>{
        console.log("NODE PROGRESS: ",progress);
    },[progress])

    return (
        <div className="flex flex-col absolute right-5">
            {progress.map((node)=>
                <div key={node.id} className="flex flex-col mb-4">
                    <h1>Path: {truncateStart(node.data.path || "",20)}</h1>
                    <h1>Searched: {node.data.items} / {node.data.totalItems} items</h1>
                </div>
            )}
            {(!(quickSearch) && !(isSearchTerminated))
                ?<h1>Searched: {nodeCount.items} / {nodeCount.totalItems} items</h1>
                :null
            }
        </div>
    )
}