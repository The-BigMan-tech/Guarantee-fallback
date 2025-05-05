import SearchBar from "./search-bar/search-bar"
import ActionPane from "./action-pane/action-pane"

export default function Top() {
    return (
        <div className="relative w-full h-[12%]">
            <SearchBar/>
            <ActionPane/>
        </div>
    )
}