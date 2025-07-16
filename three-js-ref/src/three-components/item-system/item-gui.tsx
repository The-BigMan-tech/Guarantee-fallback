import { useState } from "react";
import {motion } from "motion/react"

export default function ItemGui() {
    const numCells = 21;
    const cellsArray:null[] = new Array(numCells).fill(null);
    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items');
    const [gridCols,setGridCols] = useState<number>(tab === 'Items'?3:1);
    const [gridWidth, setGridWidth] = useState(tab === 'Items' ? 20 : 10);

    function toggleTab() {
        setTab((prev)=>{
            const newTab =(prev=="Inventory")?'Items':"Inventory"
            if (newTab =="Items") {
                setGridCols(3);
                setGridWidth(20)
            }else {
                setGridCols(1);
                setGridWidth(10);
            }
            return newTab
        })  
    }
    return (
        <>
            <div className="absolute z-20 top-[2%] left-[4%] flex items-center gap-[25%] font-[Consolas] font-bold text-[#fcfcfcef] ">
                <button className="bg-[#2e2e2eb3] w-[9.5vw] py-[4%] shadow-sm cursor-pointer" onClick={toggleTab}>{tab}</button>
            </div>

            <motion.div    
                animate={{ width: `${gridWidth}%` }}
                className={`grid h-[90%] grid-cols-${gridCols} absolute z-20 top-[8%] left-[4%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`}>
                    {cellsArray.map((_,index) => (
                        <div key={index} className='bg-[#2424246b] rounded w-full aspect-square shadow-lg'/>
                    ))}
            </motion.div>
        </>
    )
}