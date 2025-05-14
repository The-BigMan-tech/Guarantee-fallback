import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode,selectSearchResults,selectSearchTermination,searchDir,terminateSearch,selectSearchProgress,SearchProgress} from "../../redux/processingSlice"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useEffect, useMemo, useState } from "react"
import {v4 as uniqueID} from "uuid"
import { useAppDispatch } from "../../redux/hooks"
import Progress from "./progress"

export default function Body() {
    const dispatch = useAppDispatch();
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const uniqueFsNodes: UniqueFsNode[] | null = useMemo(() => fsNodes?.map(fsNode=>({ id: uniqueID(),fsNode})) || null, [fsNodes]);
    const searchResults:FsNode[] | null = selector(store=>selectSearchResults(store))
    const uniqueSearchResults:UniqueFsNode[] | null = useMemo(()=>searchResults?.map(fsNode=>({id:uniqueID(),fsNode})) || null,[searchResults]);
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));
    const searchProgress:Record<string,SearchProgress> = selector(store=>selectSearchProgress(store));
    const [thereIsProgress] = useState<boolean>(Object.keys(searchProgress).length > 0)
    const [showProgressWin,setShowProgressWin] = useState<boolean>(true)

    async function exitSearch() {
        await dispatch(searchDir("",0));
    }
    function quitSearch() {
        dispatch(terminateSearch());
    }
    function truncateStart(str:string, maxLength:number) {
        if (str.length <= maxLength) {
            return str; 
        }
        return '...' + str.slice(str.length - (maxLength - 3));
    }
    function openProgressWindow():boolean {
        return thereIsProgress && showProgressWin
    }
    function widthOnProgress():string {
        return (openProgressWindow())?'w-[75%]':'w-[99%]'
    }
    function toggleProgressWin() {
        setShowProgressWin(!showProgressWin)
    }
    useEffect(()=>{
        console.log("Search progress",JSON.stringify(searchProgress,null,2));
    },[searchProgress])
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {!(isSearchTerminated)//show the terminate button while its searching
                    ?<button className="cursor-pointer text-[#eaa09b] font-bold absolute top-16 left-[50%]" onClick={quitSearch}>Terminate</button>
                    :null
                }
                {(uniqueSearchResults)//if the user hasnt inputted any search query because no query means no results
                    ?<>
                        {(uniqueSearchResults.length)//if the matched searches are not empty
                            ?<div className="flex flex-col items-center pb-10 h-full">
                                {(isSearchTerminated)
                                    ?<button className="cursor-pointer absolute top-16 text-white font-bold" onClick={exitSearch}>Clear search results</button>
                                    :null
                                }
                                <FsDisplay {...{uniqueFsNodes:uniqueSearchResults,width:widthOnProgress(),toggleProgressWin,thereIsProgress}}/>
                            </div>
                            :<>
                                {(isSearchTerminated)
                                    ?<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">No search results</h1>
                                    :<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">Still searching...</h1>
                                }
                            </>
                            
                        }
                    </>
                    :<FsDisplay {...{uniqueFsNodes,width:widthOnProgress(),toggleProgressWin,thereIsProgress}}/>
                }
                {(openProgressWindow())
                    ?<Progress {...{searchProgress}}/>
                    :null
                }
            </div>
        </>
    )
}