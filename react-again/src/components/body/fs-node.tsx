import { FsNode } from "../../utils/rust-fs-interface"
import { useAppDispatch,selector} from "../../redux/hooks"
import { openDirectoryInApp,selectLoadingMessage} from "../../redux/processingSlice";
import { useEffect, useState } from "react";

export default function FsNodeComponent(props:{fsNode:FsNode}) {
    const dispatch = useAppDispatch();
    const loadingMessage:string = selector(store=>selectLoadingMessage(store)) || "";
    const [shouldFreeze,setShouldFreeze] = useState<boolean>(true);

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
    async function openFolder(fsNode:FsNode):Promise<void> {
        if (!(shouldFreeze)) {
            if (fsNode.primary.nodeType == "Folder") {
                dispatch(await openDirectoryInApp(fsNode.primary.nodePath))
            }
            return
        }
    }
    function freezeClass():string {
        return (shouldFreeze)?"opacity-30":"cursor-pointer"
    }
    useEffect(()=>{
        setShouldFreeze(loadingMessage.trim().toLowerCase().startsWith("loading"))
        console.log("should freeze ui",shouldFreeze);
    },[loadingMessage,shouldFreeze])
    return (
        <button onDoubleClick={()=>openFolder(props.fsNode)} className={`flex flex-col items-center justify-center gap-2 ${freezeClass()}`}>
            <img className={`${fixIconSize(props.fsNode.primary.iconPath)}`} src={`./assets/file-icons/${props.fsNode.primary.iconPath}`} alt="" />
            <h1 className="text-sm font-sans mb-5">{truncateName(props.fsNode.primary.nodeName)}</h1>
        </button>
    )
}