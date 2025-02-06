'use client'
import { useState } from "react"

export default function Random() {
    const [count,setCount] = useState<number>(0)
    return (
        <>
            <h1 className="font-roboto">Random</h1>
            <h1>{count}</h1>
            <button onClick={()=>setCount(prev=>prev+1)}>Increment</button>
        </>
    )
}