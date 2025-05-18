import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode,selectSearchResults,selectSearchTermination,searchDir,terminateSearch,selectOpenedFile} from "../../redux/processingSlice"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useEffect, useState } from "react"
import {v4 as uniqueID} from "uuid"
import { useAppDispatch } from "../../redux/hooks"
import Preview from "./previews/preview"


export default function Body() {
    const dispatch = useAppDispatch();
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const [uniqueFsNodes,setUniqueFsNodes]  = useState<UniqueFsNode[] | null>([])
    const searchResults:FsNode[] | null = selector(store=>selectSearchResults(store))
    const [uniqueSearchResults,setUniqueSearchResults] = useState<UniqueFsNode[] | null>();
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));
    const openedFile = selector(store=>selectOpenedFile(store));


    async function exitSearch() {
        await dispatch(searchDir("",0));
    }
    function quitSearch() {
        dispatch(terminateSearch());
    }
    useEffect(()=>{
        setUniqueFsNodes(()=>{
            console.log("FSNODE PROCESSING:",fsNodes);
            if (fsNodes) {
                const newNodes = fsNodes.map(node => ({ id: uniqueID(), fsNode: node }));
                return newNodes
            }else {return null}
        })
    },[fsNodes])
    useEffect(()=>{
        setUniqueSearchResults((prev)=>{
            if (searchResults) {
                const newNodes = searchResults.map(node => ({ id: uniqueID(), fsNode: node }));
                return (searchResults.length)?[...prev || [],...newNodes]:newNodes
            }else {return null}
        })
    },[searchResults])
    return (
        <>
            <div className={`h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md`}>
                {openedFile 
                    ?<Preview/>
                    :<>
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
                                        <FsDisplay {...{uniqueFsNodes:uniqueSearchResults}}/>
                                    </div>
                                    :<>
                                        {(isSearchTerminated)
                                            ?<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">No search results</h1>
                                            :<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">Still searching...</h1>
                                        }
                                    </>
                                    
                                }
                            </>
                            :<FsDisplay {...{uniqueFsNodes}}/>
                        }
                    </>
                }
            </div>
        </>
    )
}