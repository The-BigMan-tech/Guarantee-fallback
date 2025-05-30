import { FsNode } from "../../utils/rust-fs-interface"
import { useAppDispatch,selector} from "../../redux/hooks"
import { openFile } from "../../redux/thunks/file-op";
import { openDirectoryInApp } from "../../redux/thunks/open-dir-related";
import { selectFreezeNodes, selectSearchTermination} from "../../redux/selectors";
import {motion} from "motion/react"
import { memo } from "react";

function areEqual(prevProps: Props, nextProps: Props) {
    return prevProps.fsNode.primary.nodePath == nextProps.fsNode.primary.nodePath
}
interface Props {
    fsNode:FsNode
}
export const FsNodeComponent = memo((props:Props)=> {
    const dispatch = useAppDispatch();
    const shouldUnFreeze = selector(store=>!(selectFreezeNodes(store)));
    const isSearchTerminated = selector(store=>selectSearchTermination(store))

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
            }else if ((fsNode.primary.nodeType == "File")) {
                dispatch(openFile(fsNode))
            }
            return
        }
    }
    function unFreezeClass():string {
        return (shouldUnFreeze)?"opacity-100 cursor-pointer":""
    }
    const content = (
        <>
            <img className={`${fixIconSize(props.fsNode.primary.iconPath)}`} src={`./assets/file-icons/${props.fsNode.primary.iconPath}`} alt="" />
            <h1 className="text-sm font-sans mb-5">{truncateName(props.fsNode.primary.nodeName)}</h1>
        </>
    )
    const baseClass = `flex flex-col items-center justify-center gap-2 opacity-30 cursor-default ${unFreezeClass()}`
    //the below condition tells it to switch to an inanimate component whenever it shold freeze so that animation doesnt control its properties
    return (
        <>
        {/*This reads that if the component is unforzen or if its during the search process,animate.the reason why im allowing it during the search process is because of ui flickering when search results appear */}
        {(shouldUnFreeze || !(isSearchTerminated))
            ?<motion.button
                whileHover={{ scale: 1.1 }}
                initial={{ y:60,opacity:0}}  
                animate={{ y: 0,opacity:1}}  
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onDoubleClick={()=>openFolder(props.fsNode)} 
                className={`${baseClass}`}> 
                    {content}
            </motion.button>
            :<button className={`${baseClass}`} onDoubleClick={()=>openFolder(props.fsNode)} >
                {content}
            </button>
        }
        </>
    )
},areEqual)

