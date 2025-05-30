import { selectOpenedFile, selectOpenedNode } from "../../../redux/selectors";
import { selector } from "../../../redux/hooks"
import { useEffect, useMemo } from "react";
import { memConsoleLog } from "../../../utils/log-config";

export default function Preview() {
    const openedFile = selector(store=>selectOpenedFile(store))
    const node = selector(store=>selectOpenedNode(store));
    const ext = useMemo(()=>node?.primary.fileExtension,[node])

    useEffect(()=>{
        memConsoleLog("Opened file: ",openedFile)
    },[openedFile])

    if (openedFile) {
        if ((ext == 'png') || (ext == 'jpg')) {
            return (
                <div className="relative top-[4.5%] h-full flex flex-col items-center justify-center">
                    <img src={openedFile} className="img-display"/>
                </div>
            )
        }else if (ext == "svg") {
            return (
                <div className="relative top-[4.5%] h-full flex flex-col items-center justify-center">
                    <img src={openedFile} className="img-display"/>
                </div>
            )
        }else {
            return (
                <div className="relative h-full flex flex-col items-center justify-center">
                    <h1 className="text-lg">Format not supported</h1>
                </div>
            )
        }
    }
}