import { useAppDispatch } from "../../../redux/hooks"
import { openParentInApp } from "../../../redux/processingSlice"

export default function SearchBar() {
    const dispatch = useAppDispatch();
    async function goToParent() {
        await dispatch(await openParentInApp())
    }
    return (
        <div className="bg-[#1f1f30] w-full border-b border-[#3a3a3a] shadow-sm flex items-center h-[60%]">
            <button onClick={goToParent} className="font-bold ml-5 cursor-pointer">{"<="}</button>
        </div>
    )
}