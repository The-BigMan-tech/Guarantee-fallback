import { useState } from 'react'
import './App.css'

function App() {
  const [count,setCount] = useState(0)
  return (
    <>
    <img className='w-10 h-10' src="/react.svg" alt="" />
    <h1 className='text-red-500'>hello</h1>
    <p>HH</p>
    <h1>Current count: {count}</h1>
    <button className='cursor-pointer' onClick={()=>setCount(prev=>prev+1)}>Increment count</button>
    </>
  )
}

export default App
