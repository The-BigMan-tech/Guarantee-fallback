import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode,selectSearchResults,selectSearchTermination,searchDir} from "../../redux/processingSlice"
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
    const shouldTerminateSearch:boolean = selector(store=>selectSearchTermination(store))
    
    async function exitSearch() {
        dispatch(await searchDir(""));
    }
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {(uniqueSearchResults)//if the user hasnt inputted any search query
                    ?<>
                        {(uniqueSearchResults.length)//if the matched searches are empty
                            ?<div className="flex flex-col items-center pb-10 h-full">
                                <button className="cursor-pointer absolute top-16 text-[#9bbaea] font-bold" onClick={exitSearch}>Clear search results</button>
                                <FsDisplay {...{uniqueFsNodes:uniqueSearchResults}}/>
                            </div>
                            :<>
                                {(shouldTerminateSearch)
                                    ?<h1 className="text-white text-2xl absolute top-[50%] left-[40%] font-[Consolas]">No search results</h1>
                                    :<h1 className="text-white text-2xl absolute top-[50%] left-[40%] font-[Consolas]">Still searching...</h1>
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