import {selector} from "@/app/hooks"
import { selectCountFrom } from "@/features/Body/body-slice"

export default function ReduxRef() {
    const count:number = selector((store)=>selectCountFrom(store))
    return (
        <>
            <div>Hello worlds</div>
            <div>{count}</div>
            <label className="daisy-swap daisy-swap-flip text-9xl">
                <input type="checkbox" />
                <div className="daisy-swap-on">😃</div>
                <div className="daisy-swap-off">😞</div>
            </label>
        </>
    )
}