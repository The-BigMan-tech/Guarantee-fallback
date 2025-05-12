import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode,selectSearchResults,selectSearchTermination,searchDir,terminateSearch} from "../../redux/processingSlice"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useMemo } from "react"
import {v4 as uniqueID} from "uuid"
import { useAppDispatch } from "../../redux/hooks"

export default function Body() {
    const dispatch = useAppDispatch();
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const uniqueFsNodes: UniqueFsNode[] | null = useMemo(() => fsNodes?.map(fsNode=>({ id: uniqueID(),fsNode})) || null, [fsNodes]);
    const searchResults:FsNode[] | null = selector(store=>selectSearchResults(store))
    const uniqueSearchResults:UniqueFsNode[] | null = useMemo(()=>searchResults?.map(fsNode=>({id:uniqueID(),fsNode})) || null,[searchResults]);
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store))
    
    async function exitSearch() {
        dispatch(await searchDir(""));
    }
    function quitSearch() {
        dispatch(terminateSearch());
    }
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {!(isSearchTerminated)//show the terminate button while its searching
                    ?<button className="cursor-pointer absolute top-16 left-[50%] text-[#eaa09b] font-bold" onClick={quitSearch}>Terminate</button>
                    :null
                }
                {(uniqueSearchResults)//if the user hasnt inputted any search query
                    ?<>
                        {(uniqueSearchResults.length)//if the matched searches are empty
                            ?<div className="flex flex-col items-center pb-10 h-full">
                                {(isSearchTerminated)
                                    ?<button className="cursor-pointer absolute top-16 text-[#9beaea] font-bold" onClick={exitSearch}>Clear search results</button>
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
            </div>
        </>
    )
}