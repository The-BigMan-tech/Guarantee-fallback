import { SearchProgress } from "../../redux/processingSlice"

export default function Progress({searchProgress}:{searchProgress:Record<string,SearchProgress>}) {
    return (
        <div className="flex flex-col bg-[#141428]">
            <h1>Hello progress</h1>
        </div>
    )
}