import { selectOpenedFile, selectOpenedNode } from "../../../redux/selectors";
import { selector } from "../../../redux/hooks"
import { useEffect, useMemo } from "react";
import { memConsoleLog } from "../../../utils/log-config";;

export default function Preview() {
    const openedFile = selector(store=>selectOpenedFile(store))
    const node = selector(store=>selectOpenedNode(store));
    const ext = useMemo(()=>node?.primary.fileExtension,[node])

    useEffect(()=>{
        memConsoleLog("Opened file: ",openedFile)
    },[openedFile])
    
    if (openedFile) {
        if ((ext == 'png') || (ext == 'jpg') || (ext == 'svg')) {
            return (
                <div className="preview-container">
                    <img src={openedFile} className="img-display"/>
                </div>
            )
        }else if (ext == "mp4") {
            return (
                <div className="preview-container">
                    <video src={openedFile} controls autoPlay muted/>
                </div>
            )
        }else {
            return (
                <div className="preview-container">
                    <h1 className="text-lg">Format not supported</h1>
                </div>
            )
        }
    }
}