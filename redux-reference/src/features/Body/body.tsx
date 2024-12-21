import {increment} from './body-slice'
import {state,useAppDispatch} from "@/app/hooks"
import { selectCountFrom } from './body-slice'

export default function Body() {
    const dispatch = useAppDispatch()
    const count:number = state((store)=>selectCountFrom(store))
    return (
        <>
            <div>Hello world</div>
            <button onClick={()=>dispatch(increment(2))}>Increment</button>
            <div>{count}</div>
        </>
    )
}