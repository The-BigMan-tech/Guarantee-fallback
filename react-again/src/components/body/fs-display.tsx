import { FsNodeComponent } from "./fs-node"
import { FsNode } from "../../utils/rust-fs-interface"

interface Props {
    fsNodes:FsNode[] | null,
}
export default function FsDisplay({fsNodes}:Props) {
    return (
        <>  
            {fsNodes?.length//if there is content,render the fs components
                ?<div className='grid sm:grid-cols-4 md:grid-cols-5 h-auto pb-10 pt-5 max-h-[96%] gap-x-[1.2%] gap-y-[5%] mt-[2%] w-[100%] overflow-y-scroll overflow-x-hidden items-center justify-center'>
                    {fsNodes.map((fsNode)=>
                        <FsNodeComponent key={fsNode.primary.nodePath} {...{fsNode}}/>
                    )}
                </div>
                :<div className="self-center justify-self-center relative top-[40vh] text-2xl font-[Consolas]">
                    {fsNodes?.length == 0//if its still loading/if the list variable is an empty array,
                        ?<h1 className="text-[#91b6ee]">Loading content...</h1>
                        :<h1>There is no content</h1>//if it loaded but its empty/if the list variable is null
                    }
                </div>
            }
        </>
    )
}