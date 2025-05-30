import { SearchResult } from "../../redux/types";
import { selector,useAppDispatch} from "../../redux/hooks";
import { selectSearchTermination,selectSearchResults } from "../../redux/selectors";
import FsDisplay from "./fs-display";
import { clearSearchResults } from "../../redux/thunks/search-engine";

export default function SearchResults() {
    const dispatch = useAppDispatch();
    const searchResults:SearchResult[] | null = selector(store=>selectSearchResults(store))
    const isSearchTerminated:boolean = selector(store=>selectSearchTermination(store));

    function exitSearch() {
        dispatch(clearSearchResults())
    }
    if (searchResults) {
        return (
            <>
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
        )
    }
}