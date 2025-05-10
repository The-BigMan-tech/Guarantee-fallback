import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode,selectSearchResults} from "../../redux/processingSlice"
import { FsNode} from "../../utils/rust-fs-interface"
import FsDisplay from "./fs-display"
import { useMemo } from "react"
import {v4 as uniqueID} from "uuid"

export default function Body() {
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const uniqueFsNodes: UniqueFsNode[] | null = useMemo(() => fsNodes?.map(fsNode=>({ id: uniqueID(),fsNode})) || null, [fsNodes]);
    const searchResults:FsNode[] | null = selector(store=>selectSearchResults(store))
    const uniqueSearchResults:UniqueFsNode[] | null = useMemo(()=>searchResults?.map(fsNode=>({id:uniqueID(),fsNode})) || null,[searchResults])
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {(uniqueSearchResults)
                    ?<>
                        {(uniqueSearchResults.length)
                            ?<FsDisplay {...{uniqueFsNodes:uniqueSearchResults}}/>
                            :<h1 className="text-white text-2xl absolute top-[50%] left-[50%] font-[Consolas]">No search results</h1>
                        }
                    </>
                    :<FsDisplay {...{uniqueFsNodes}}/>
                }
            </div>
        </>
    )
}