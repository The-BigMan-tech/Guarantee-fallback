import {increment,incrementIfOdd} from './body-slice'
import {state,useAppDispatch} from "@/app/hooks"
import { selectCountFrom } from './body-slice'

export default function Body() {
    const dispatch = useAppDispatch()
    const count:number = state((store)=>selectCountFrom(store))

    function increase() {
        dispatch(increment(1))
        dispatch(incrementIfOdd(1))
    }
    return (
        <>
            <div>Hello world</div>
            <button onClick={increase}>Increment</button>
            <div>{count}</div>
        </>
    )
}