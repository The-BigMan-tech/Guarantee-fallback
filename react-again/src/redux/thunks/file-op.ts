import { AppThunk } from "../store";
import {FsNode} from "../../utils/rust-fs-interface";
import { setCurrentPath,setOpenedFile,setOpenedNode} from "../slice";
import { convertFileSrc } from "@tauri-apps/api/core";
import { selectCurrentPath } from "../selectors";

let prevPath = ''
export function openFile(node:FsNode):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        prevPath = selectCurrentPath(getState())//saving the prev path so that we can revert to it on file close
        const path = node.primary.nodePath;
        dispatch(setCurrentPath(path));
        const normalizedPath = path.replace(/\\/g, "/");
        const url = convertFileSrc(normalizedPath);
        dispatch(setOpenedFile(url))
        dispatch(setOpenedNode(node))
    }
}
export function cancelFile():AppThunk {
    return (dispatch)=>{
        dispatch(setOpenedFile(null));// my reducer does the revoking of the old url.all this needs to do is to set the new one to null
        dispatch(setCurrentPath(prevPath))
    }
}