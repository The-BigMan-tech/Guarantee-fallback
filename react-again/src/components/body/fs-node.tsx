import { FsNode } from "../../utils/rust-fs-interface"

export default function FsNodeComponent(props:{fsNode:FsNode}) {
    function truncateName(fsNode:FsNode):string {
        const nodeName = fsNode.primary.nodeName;
        if (nodeName.length < 16) {
            return nodeName
        }else {
            return `${nodeName.slice(0,16)}~~.${fsNode.primary.fileExtension}`
        }
    }
    return (
        <div>
            <h1 className="text-sm">{truncateName(props.fsNode)}</h1>
        </div>
    )
}