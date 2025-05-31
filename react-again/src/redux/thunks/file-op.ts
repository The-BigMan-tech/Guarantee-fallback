import { AppThunk } from "../store";
import { base_name ,readFile,FsResult,FsNode} from "../../utils/rust-fs-interface";
import { setError,setNotice,setCurrentPath,setOpenedFile, setFreezeNodes, setOpenedNode} from "../slice";
import {toast} from "react-toastify"
import { convertFileSrc } from "@tauri-apps/api/core";
//*Thunk dependency
import { loading_toastConfig, success_toastConfig } from "../../utils/toast-configs";


export function returnFileContent(filePath:string):AppThunk<Promise<string | null>> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        const fileName = await base_name(filePath,false);
        toast.loading(`Loading the file: ${fileName}`,loading_toastConfig)
        dispatch(setFreezeNodes(true))

        const contentResult:FsResult<string | Error | null>  = await readFile(filePath);
        if (contentResult.value instanceof Error) {
            dispatch(setError(`The error "${contentResult.value.message}" occured when reading the file: "${filePath}"`))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice(`The following file is empty: ${filePath}`))
            return null;
        }else {
            toast.dismiss()
            toast.success(`Done loading: ${fileName}`,success_toastConfig)
            dispatch(setFreezeNodes(false))
            return contentResult.value
        }
    }
}
export function openFile(node:FsNode):AppThunk<Promise<void>> {
    return async (dispatch)=>{
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
    }
}