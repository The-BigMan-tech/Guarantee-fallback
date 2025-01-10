import { useAppDispatch } from "../../hooks"
import { useState,useEffect } from "react"
import {v4 as uniqueID} from 'uuid'
import { display } from "./input-slice"
import {evaluate} from 'mathjs'

export default function Input() {
    const dispatch = useAppDispatch()
    const [input,setInput] = useState('')
    const [buttons] = useState([
        {
            id:uniqueID(),
            text:"7"
        },
        {
            id:uniqueID(),
            text:"8"
        },
        {
            id:uniqueID(),
            text:"9"
        },
        {
            id:uniqueID(),
            text:"DEL"
        },
        {
            id:uniqueID(),
            text:"4"
        },
        {
            id:uniqueID(),
            text:"5"
        },
        {
            id:uniqueID(),
            text:"6"
        },
        {
            id:uniqueID(),
            text:"+"
        },
        {
            id:uniqueID(),
            text:"1"
        },
        {
            id:uniqueID(),
            text:"2"},
        {
            id:uniqueID(),
            text:"3"
        },
        {
            id:uniqueID(),
            text:"-"
        },
        {
            id:uniqueID(),
            text:"."
        },
        {
            id:uniqueID(),
            text:"0"
        },
        {
            id:uniqueID(),
            text:"/"
        },
        {
            id:uniqueID(),
            text:"x"
        }
    ])
    function pressButton(button:string):void {
        if (button === 'DEL') {
            setInput(input.slice(0,-1))
            return
        }
        if (button === 'x') {
            setInput(input + '*')
            return
        }
        setInput(input + button)
    }
    function reset():void {
        setInput('')
    }
    function submitResult() {
        console.log('RESULT:',evaluate(input));
        setInput(evaluate(input))
    }
    useEffect(()=>{
        console.log('CALCULATION',input);
        dispatch(display(input))
    },[input,dispatch])

    return (
        <>  
            <div className="flex flex-col bg-[#242d44] w-[30%] items-center rounded-xl h-[85%] relative gap-6 pt-10">
                <div className="text-xl grid grid-rows-4 grid-cols-4 gap-x-3 gap-y-5">
                    {
                        buttons.map(button=>(
                            <button onClick={()=>pressButton(button.text)} className={`font-space py-3 px-4 rounded-lg shadow-md font-bold text-2xl ${(button.text==='DEL')?'bg-[#647299] text-white hover:bg-[#384f68]':'text-[#414757] bg-[#eae3db] hover:bg-[#3b4664] hover:text-white'}`} key={button.id}>{button.text}</button>
                        ))
                    }
                </div>
                <div className="flex flex-wrap gap-10 items-center">
                    <button onClick={reset} className="font-space font-bold bg-[#647299] text-white text-xl rounded-lg py-3 px-16 shadow-md hover:bg-[#384f68]">RESET</button>
                    <button onClick={submitResult} className="bg-[#d13f30] text-white px-12 text-2xl shadow-md rounded-lg font-bold text-center h-[100%]">=</button>
                </div>
            </div>
        </>
    )
}