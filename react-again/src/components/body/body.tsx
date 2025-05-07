import { selector } from "../../redux/hooks"
import { selectFsNodes,UniqueFsNode} from "../../redux/processingSlice"
import { FsNode} from "../../utils/rust-fs-interface"
import FsNodeComponent from "./fs-node"
import { useMemo } from "react"
import {v4 as uniqueID} from "uuid"

export default function Body() {
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store));
    const uniqueFsNodes: UniqueFsNode[] | null = useMemo(() => fsNodes?.map(fsNode=>({ id: uniqueID(),fsNode})) || null, [fsNodes]);
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {uniqueFsNodes?.length//if there is content,render the fs components
                    ?<div className="grid sm:grid-cols-4 md:grid-cols-5 h-auto pb-5 max-h-[96%] gap-x-[1.2%] gap-y-[5%] mt-[2%] ml-[1.5%] w-[99%] overflow-y-scroll overflow-x-hidden items-center justify-center">
                        {uniqueFsNodes.map((uniqueFsNode)=>
                            <div key={uniqueFsNode.id} className="flex justify-center items-center">
                                <FsNodeComponent  {...{fsNode:uniqueFsNode.fsNode}}/>
                            </div>
                        )}
                    </div>
                    :<div className="self-center justify-self-center relative top-[40vh] text-2xl font-[Consolas]">
                        {uniqueFsNodes?.length == 0//if its still loading/if the list variable is an empty array,
                            ?<h1>Loading content...</h1>
                            :<h1>There is no content</h1>//if it loaded but its empty/if the list variable is null
                        }
                    </div>
                }
            </div>
        </>
    )
}