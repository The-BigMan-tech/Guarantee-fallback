import { useAppDispatch,selector} from "../../../redux/hooks"
import { openParentInApp,selectCurrentPath,selectTabNames} from "../../../redux/processingSlice"

export default function SearchBar() {
    const dispatch = useAppDispatch();
    const currentPath:string = selector(store=>selectCurrentPath(store));
    const tabNames:Set<string> = new Set(selector(store=>selectTabNames(store)))
    async function goToParent() {
        await dispatch(await openParentInApp())
    }
    function shouldRenderArrow():boolean {
        const pathName = currentPath.slice(currentPath.lastIndexOf("\\") + 1);
        console.log("Path name",pathName);
        console.log("Tab names",tabNames,"included?",pathName in tabNames);
        if (tabNames.has(pathName)) {
            return false
        }
        return true
    }   
    return (
        <div className="bg-[#1f1f30] w-full border-b border-[#3a3a3a] shadow-sm flex items-center h-[60%]">
            {shouldRenderArrow()
                ?<button onClick={goToParent} className="font-bold ml-5 cursor-pointer">{"<="}</button>
                :null
            }
        </div>
    )
}