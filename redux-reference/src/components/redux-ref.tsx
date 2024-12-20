import { useSelector } from "react-redux"

interface RootState{
    counter:{
        value:number
    }
}
export default function ReduxRef() {
    const count = useSelector((state:RootState)=>state.counter.value)
    return (
        <>
            <div>Hello worlds</div>
            <div>{count}</div>
        </>
    )
}