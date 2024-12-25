import {increment,incrementIfOdd,fetchItems} from './body-slice'
import {selector,useAppDispatch} from "@/app/hooks"
import { selectCountFrom,selectLoadingFrom} from './body-slice'
import { useEffect } from 'react'
import {useGetItemsQuery} from '../api/api-slice'


export default function Body() {
    const dispatch = useAppDispatch()
    const count:number = selector((store)=>selectCountFrom(store))
    const loading:boolean = selector((store)=>selectLoadingFrom(store));
    const { data: boards, error, isLoading } = useGetItemsQuery();

    useEffect(()=>{
        dispatch(fetchItems(''))
        console.log('BOARDS FROM SERVER: ',boards,'ERROR',error,'IS LOADING',isLoading)
    },[dispatch,boards,error,isLoading]);

    if (loading) return <p>Loading...</p>;

    function increase() {
        dispatch(increment());
        dispatch(incrementIfOdd(2));
    }
    return (
        <>
            <div>Hello world</div>
            <button onClick={increase}>Increment</button>
            <div>{count}</div>
            <div>Board</div>
            <ul>
                {boards && boards.map((item, index) => (
                    <li key={index}>{item.name}</li>
                ))}
            </ul>
        </>
    )
}