import {increment} from './body-slice'
import { useAppSelector,useAppDispatch } from "@/app/hooks"
import { useAtom } from 'jotai'
import { proton } from './atoms'

export default function Body() {
    const [_neutron,setNeutron] = useAtom(proton)
    console.log(_neutron);
    const count:number = useAppSelector(state=>state.counter.value)
    const dispatch = useAppDispatch()
    return (
        <>
            <div>Hello world</div>
            <button onClick={()=>dispatch(increment(2))}>Increment</button>
            <div>{count}</div>
            <button onClick={()=>setNeutron(old=>old += 1)}>Increment atom</button>
        </>
    )
}