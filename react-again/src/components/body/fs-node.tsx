import { FsNode } from "../../utils/rust-fs-interface"

export default function FsNodeComponent(props:{fsNode:FsNode}) {
    return (
        <div>
            <h1>{props.fsNode.primary.nodeName}</h1>
        </div>
    )
}