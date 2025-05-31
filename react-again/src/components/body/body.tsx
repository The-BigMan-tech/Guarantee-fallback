import { selector } from "../../redux/hooks"
import { selectFsNodes,selectSearchResults,selectSearchTermination,selectOpenedFile} from "../../redux/selectors"
import { terminateSearch } from "../../redux/thunks/search-engine"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useAppDispatch } from "../../redux/hooks"
import Preview from "./previews/preview"
import { SearchResult } from "../../redux/types"
import SearchResults from "./search-results"



export default function Body() {
    const dispatch = useAppDispatch();
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const searchResults:SearchResult[] | null = selector(store=>selectSearchResults(store))
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));
    const openedFile = selector(store=>selectOpenedFile(store));

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
                            ?<SearchResults/>
                            :<FsDisplay {...{fsNodes}}/>
                        }
                    </>
                }
            </div>
        </>
    )
}