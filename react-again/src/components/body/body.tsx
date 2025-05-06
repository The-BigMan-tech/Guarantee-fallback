import { selector } from "../../redux/hooks"
import { selectFsNodes} from "../../redux/processingSlice"
import { FsNode } from "../../utils/rust-fs-interface"

export default function Body() {
    const fsNodes:FsNode[] | null = selector(store=>selectFsNodes(store))
    return (
        <>
            <div className="h-[100%] bg-[#1f1f30] w-[90%] shadow-md rounded-md">
                <h1 className="mt-10">Hello body</h1>
            </div>
        </>
    )
}