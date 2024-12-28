import { selector } from "../../hooks"
import { selectInput } from "../input/input-slice"

export default function Display() {
    const display:string = selector(store=>selectInput(store))
    return (
        <>
            <h1 className="bg-[#181f32] text-white w-[30%] pr-10 py-3 font-bold text-4xl rounded-lg h-[15%] flex items-center justify-end">{display || 0}</h1>
        </>
    )
}