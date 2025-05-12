import { FsNodeComponent } from "./fs-node"
import { UniqueFsNode } from "../../redux/processingSlice"

export default function FsDisplay({uniqueFsNodes}:{uniqueFsNodes:UniqueFsNode[] | null}) {
    return (
        <>
            {uniqueFsNodes?.length//if there is content,render the fs components
                ?<div className="grid sm:grid-cols-4 md:grid-cols-5 h-auto pb-5 pt-5 max-h-[96%] gap-x-[1.2%] gap-y-[5%] mt-[2%] ml-[1.5%] w-[99%] overflow-y-scroll overflow-x-hidden items-center justify-center">
                    {uniqueFsNodes.map((uniqueFsNode)=>
                        <div key={uniqueFsNode.id} className="flex justify-center items-center">
                            <FsNodeComponent  {...{fsNode:uniqueFsNode.fsNode}}/>
                        </div>
                    )}
                </div>
                :<div className="self-center justify-self-center relative top-[40vh] text-2xl font-[Consolas]">
                    {uniqueFsNodes?.length == 0//if its still loading/if the list variable is an empty array,
                        ?<h1 className="text-[#91b6ee]">Loading content...</h1>
                        :<h1>There is no content</h1>//if it loaded but its empty/if the list variable is null
                    }
                </div>
            }
        </>
    )
}