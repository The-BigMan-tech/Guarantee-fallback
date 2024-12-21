import {state} from "@/app/hooks"
import { selectCountFrom } from "@/features/Body/body-slice"

export default function ReduxRef() {
    const count:number = state((store)=>selectCountFrom(store))
    return (
        <>
            <div>Hello worlds</div>
            <div>{count}</div>
            <label className="daisy-swap daisy-swap-rotate text-9xl">
                <input type="checkbox" />
                <div className="daisy-swap-on">😃</div>
                <div className="daisy-swap-off">😞</div>
            </label>
        </>
    )
}