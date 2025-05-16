import { cancelFile, selectOpenedFile } from "../../../redux/processingSlice"
import { selector, useAppDispatch } from "../../../redux/hooks"
import ReactPlayer from "react-player"

export default function Preview() {
    const dispatch = useAppDispatch();
    const openedFile = selector(store=>selectOpenedFile(store))

    function closeFile() {
        dispatch(cancelFile())
    }
    function toFileUrl(filePath: string): string {
        const path = filePath.replace(/\\/g, '/');
        return `tauri:///${path}`;
    }

    return (
        <div className="relative top-[10%]">
            <button className="cursor-pointer" onClick={closeFile}>Cancel</button>
            <div>
                {openedFile?.primary.fileExtension == "mp4"
                    ?<ReactPlayer url={toFileUrl(openedFile.primary.nodePath)}/>
                    :null
                }
            </div>
        </div>
    )
}