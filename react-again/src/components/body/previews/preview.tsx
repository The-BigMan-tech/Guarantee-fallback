import { cancelFile } from "../../../redux/thunks/file-op";
import { selectOpenedFile } from "../../../redux/selectors";
import { selector, useAppDispatch } from "../../../redux/hooks"
import { useEffect } from "react";
import { memConsoleLog } from "../../../utils/log-config";
import Iframe from 'react-iframe';

export default function Preview() {
    const dispatch = useAppDispatch();
    const openedFile = selector(store=>selectOpenedFile(store))

    function closeFile() {
        dispatch(cancelFile())
    }
    useEffect(()=>{
        memConsoleLog("Opened file: ",openedFile)
    },[openedFile])

    return (
        <div className="relative top-[10%] h-full ">
            <button className="cursor-pointer" onClick={closeFile}>Cancel</button>
            {openedFile
                ?<Iframe url={openedFile}
                    width="640px"
                    height="320px"
                    id=""
                    className=""
                    display="block"
                    position="relative"
                />
                :null
            }
        </div>
    )
}