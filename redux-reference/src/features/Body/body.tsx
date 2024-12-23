import {increment,incrementIfOdd,fetchItems} from './body-slice'
import {state,useAppDispatch} from "@/app/hooks"
import { selectCountFrom,selectLoadingFrom} from './body-slice'
import { useEffect } from 'react'

export default function Body() {
    const dispatch = useAppDispatch()
    const count:number = state(store=>selectCountFrom(store))
    const loading:boolean = state(store=>selectLoadingFrom(store))

    useEffect(()=>{
        dispatch(fetchItems(''))
    },[dispatch])

    if (loading) return <p>Loading...</p>;

    function increase() {
        dispatch(increment())
        dispatch(incrementIfOdd(2))
    }
    return (
        <>
            <div>Hello world</div>
            <button onClick={increase}>Increment</button>
            <div>{count}</div>
        </>
    )
}