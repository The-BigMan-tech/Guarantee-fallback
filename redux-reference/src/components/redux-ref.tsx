import { useSelector } from "react-redux"
import { useAtom } from "jotai"
import { proton } from "@/features/Body/atoms"

interface RootState{
    counter:{
        value:number
    }
}
export default function ReduxRef() {
    const [neutron] = useAtom(proton)
    const count = useSelector((state:RootState)=>state.counter.value)
    return (
        <>
            <div>Hello worlds</div>
            <div>{count}</div>
            <div>Jotai atom:{neutron}</div>
        </>
    )
}