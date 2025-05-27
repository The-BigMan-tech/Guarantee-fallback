import { AppThunk } from "../store";
import { base_name ,readFile,FsResult,FsNode} from "../../utils/rust-fs-interface";
import { setLoadingMessage,setError,setNotice,setCurrentPath,setOpenedFile} from "../slice";
//*Thunk dependency
import { openParentInApp } from "./open-dir-related";


export function returnFileContent(filePath:string):AppThunk<Promise<string | null>> {//returns the file with its content read
    return async (dispatch):Promise<string | null> =>{
        const fileName = await base_name(filePath,false);
        dispatch(setLoadingMessage(`Loading the file: ${fileName}`))

        const contentResult:FsResult<string | Error | null>  = await readFile(filePath);
        if (contentResult.value instanceof Error) {
            dispatch(setError(`The error "${contentResult.value.message}" occured when reading the file: "${filePath}"`))
            return null
        }else if (contentResult.value == null) {
            dispatch(setNotice(`The following file is empty: ${filePath}`))
            return null;
        }else {
            dispatch(setLoadingMessage(`Done loading: ${fileName}`));
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