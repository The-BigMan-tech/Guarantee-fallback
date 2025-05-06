import { selector } from "../../redux/hooks"
import { selectFsNodes} from "../../redux/processingSlice"
import { FsNode } from "../../utils/rust-fs-interface"
import FsNodeComponent from "./fs-node"

export default function Body() {
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store))
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                {fsNodes
                    ?<div className="grid sm:grid-cols-4 md:grid-cols-5 h-auto max-h-[96%] gap-x-[1.2%] gap-y-[5%] mt-[2%] ml-[1.5%] w-[99%] overflow-y-scroll overflow-x-hidden items-center justify-center">
                        {fsNodes.map((fsNode)=><FsNodeComponent {...{fsNode}}/>)}
                    </div>
                    :<h1 className="self-center justify-self-center relative top-[40vh] text-2xl font-[Consolas]">Empty</h1>
                }
            </div>
        </>
    )
}