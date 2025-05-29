import { selector } from "../../redux/hooks"
import { selectFsNodes,selectSearchResults,selectSearchTermination,selectOpenedFile} from "../../redux/selectors"
import { terminateSearch,clearSearchResults} from "../../redux/thunks/search-engine"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useAppDispatch } from "../../redux/hooks"
import Preview from "./previews/preview"
import { SearchResult } from "../../redux/types"


export default function Body() {
    const dispatch = useAppDispatch();
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const searchResults:SearchResult[] | null = selector(store=>selectSearchResults(store))
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));
    const openedFile = selector(store=>selectOpenedFile(store));

    function exitSearch() {
        dispatch(clearSearchResults())
    }
    function quitSearch() {
        dispatch(terminateSearch());
    }
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
                        {(searchResults)//if the user hasnt inputted any search query because no query means no results
                            ?<>
                                {(searchResults.length)//if the matched searches are not empty
                                    ?<div className="flex flex-col items-center pb-10 h-full">
                                        {(isSearchTerminated)
                                            ?<button className="cursor-pointer absolute top-16 text-white font-bold" onClick={exitSearch}>Clear search results</button>
                                            :null
                                        }
                                        <FsDisplay {...{fsNodes:searchResults.map(result=>result.node)}}/>
                                    </div>
                                    :<>
                                        {(isSearchTerminated)
                                            ?<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">No search results</h1>
                                            :<h1 className="text-white text-2xl absolute top-[50%] left-[45%] font-[Consolas]">Still searching...</h1>
                                        }
                                    </>
                                    
                                }
                            </>
                            :<FsDisplay {...{fsNodes}}/>
                        }
                    </>
                }
            </div>
        </>
    )
}