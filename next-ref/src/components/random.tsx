'use client'
import { useState } from "react"
import { echoInput,createPage } from "@/lib/action"

export default function Random() {
    const [count,setCount] = useState<number>(0)
    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="font-roboto">Random</h1>
            <h1>{count}</h1>
            <button onClick={()=>setCount(prev=>prev+1)}>Increment</button>
            <button onClick={async ()=>await echoInput('hh')}>Test action</button>
            <form action={createPage}>
                <input type="text" name="title"/>
                <button type="submit">Send title</button>
            </form>
        </div>
    )
}