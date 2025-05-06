import { FsNode } from "../../utils/rust-fs-interface"

export default function FsNodeComponent(props:{fsNode:FsNode}) {
    function truncateName(name:string):string {
        return (name.length < 16)?name:`${name.slice(0,16)}...`
    }
    function fixIconSize(path:string):string {
        if (path == "folder-solid.svg") {
            return "w-10"
        }else if (path == "file-solid.svg") {
            return "w-7"
        }else {
            return "w-7"//a reasonable default
        }
    }
    return (
        <button className="flex flex-col items-center justify-center gap-2 cursor-pointer">
            <img className={`${fixIconSize(props.fsNode.primary.iconPath)}`} src={`./assets/file-icons/${props.fsNode.primary.iconPath}`} alt="" />
            <h1 className="text-sm font-sans mb-5">{truncateName(props.fsNode.primary.nodeName)}</h1>
        </button>
    )
}