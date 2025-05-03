import SearchBar from "./search-bar/search-bar"
import ActionPane from "./action-pane/action-pane"

export default function Top() {
    return (
        <div className="relative w-full space-y-[0.6%]">
            <SearchBar/>
            <ActionPane/>
        </div>
    )
}