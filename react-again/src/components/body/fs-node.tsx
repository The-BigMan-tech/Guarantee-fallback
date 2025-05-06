import { FsNode } from "../../utils/rust-fs-interface"

export default function FsNodeComponent(props:{fsNode:FsNode}) {
    function truncateName(name:string):string {
        return (name.length < 16)?name:`${name.slice(0,16)}...`
    }
    return (
        <div>
            <h1 className="text-sm font-sans">{truncateName(props.fsNode.primary.nodeName)}</h1>
        </div>
    )
}