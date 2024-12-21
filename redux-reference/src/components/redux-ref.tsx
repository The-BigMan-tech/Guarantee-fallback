import { useSelector } from "react-redux"
import { useAtom } from "jotai"
import { proton } from "@/features/Body/atoms"
import { useAppSelector } from "@/app/hooks"

export default function ReduxRef() {
    const [neutron] = useAtom(proton)
    const count = useAppSelector(state=>state.counter.value)
    return (
        <>
            <div>Hello worlds</div>
            <div>{count}</div>
            <div>Jotai atom:{neutron}</div>
        </>
    )
}