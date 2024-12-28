import { selector } from "../../hooks"
import { selectInput } from "../input/input-slice"

export default function Display() {
    const display:string = selector(store=>selectInput(store))
    return (
        <>
            <div className="justify-end bg-[#181f32] text-white w-[30%] pt-3 font-bold text-4xl rounded-lg h-[15%] flex overflow-y-hidden flex-nowrap pr-4 relative">
                <h1 className="text-end w-[94%] overflow-x-scroll overflow-y-hidden custom-scrollbar">{display || 0}</h1>
            </div>
        </>
    )
}