import { selector } from "../../redux/hooks"
import { selectFsNodes} from "../../redux/processingSlice"
import { FsNode } from "../../utils/rust-fs-interface"

export default function Body() {
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store))
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                <div className="mt-6">
                    {fsNodes
                        ?<div></div>
                        :<h1>Empty</h1>
                    }
                </div>
            </div>
        </>
    )
}