import { FsNode } from "../../utils/rust-fs-interface"
import { useAppDispatch,selector} from "../../redux/hooks"
import { openDirectoryInApp,selectLoadingMessage} from "../../redux/processingSlice";
import { useEffect, useState} from "react";
import {motion} from "motion/react"
import { memo } from "react";

function areEqual(prevProps: Props, nextProps: Props) {
    return prevProps.fsNode == nextProps.fsNode
}
interface Props {
    fsNode:FsNode
}
export const FsNodeComponent = memo((props:Props)=> {
    const dispatch = useAppDispatch();
    const loadingMessage:string  = selector(store=>selectLoadingMessage(store)) || "";
    const [shouldUnFreeze,setShouldUnFreeze] = useState<boolean>(false);

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
        if (shouldUnFreeze) {
            if (fsNode.primary.nodeType == "Folder") {
                await dispatch(openDirectoryInApp(fsNode.primary.nodePath))
            }
            return
        }
    }
    function unFreezeClass():string {
        return (shouldUnFreeze)?"opacity-100 cursor-pointer":""
    }
    useEffect(()=>{
        setShouldUnFreeze(!(loadingMessage.trim().toLowerCase().startsWith("loading")));
    },[loadingMessage])
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            initial={{ y:100}}  // Start 100px left and invisible
            animate={{ y: 0}}     // Animate to natural position and fully visible
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onDoubleClick={()=>openFolder(props.fsNode)} 
            className={`flex flex-col items-center justify-center gap-2 opacity-30 cursor-default ${unFreezeClass()}`}>
                <img className={`${fixIconSize(props.fsNode.primary.iconPath)}`} src={`./assets/file-icons/${props.fsNode.primary.iconPath}`} alt="" />
                <h1 className="text-sm font-sans mb-5">{truncateName(props.fsNode.primary.nodeName)}</h1>
        </motion.button>
    )
},areEqual)