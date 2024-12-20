import {increment} from './body-slice'
import { useAppSelector,useAppDispatch } from "@/app/hooks"


export default function Body() {
    const count:number = useAppSelector(state=>state.counter.value)
    const dispatch = useAppDispatch()
    return (
        <>
            <div>Hello world</div>
            <button onClick={()=>dispatch(increment())}>Increment</button>
            <span>{count}</span>
        </>
    )
}