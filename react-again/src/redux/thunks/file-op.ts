import { AppThunk } from "../store";
import { base_name ,readFile,FsResult,FsNode} from "../../utils/rust-fs-interface";
import { setError,setNotice,setCurrentPath,setOpenedFile, setFreezeNodes} from "../slice";
import {toast} from "react-toastify"
//*Thunk dependency
import { openParentInApp } from "./open-dir-related";
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
export function openFile(fsNode:FsNode):AppThunk {
    return (dispatch)=>{
        dispatch(setCurrentPath(fsNode.primary.nodePath))
        dispatch(setOpenedFile(fsNode))
    }
}
export function cancelFile():AppThunk {
    return (dispatch)=>{
        dispatch(setOpenedFile(null));
        dispatch(openParentInApp())
    }
}