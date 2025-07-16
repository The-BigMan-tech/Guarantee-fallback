import { useState } from "react";

export default function ItemGui() {
    const numCells = 21;
    const cellsArray:null[] = new Array(numCells).fill(null);
    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items')
    const [gridCols,setGridCols] = useState<string>('');
    const [gridWidth,setGridWidth] = useState<string>('');

    function toggleTab() {
        setTab((prev)=>{
            if (prev=="Inventory") {
                setGridCols('grid-cols-3');
                setGridWidth('w-[20%]')
                return 'Items'
            }else {
                setGridCols('grid-cols-1');
                setGridWidth('w-[10%]')
                return 'Inventory'
            }
        })  
    }
    return (
        <>
            <div className="absolute z-20 top-[2%] left-[4%] flex items-center gap-[25%] font-[Consolas] font-bold text-[#fcfcfcef] ">
                <button className="bg-[#2e2e2eb3] w-[8vw] py-[4%] shadow-sm cursor-pointer" onClick={toggleTab}>{tab}</button>
            </div>

            <div className={`grid ${gridCols} h-[90%] absolute z-20 top-[8%] left-[4%] ${gridWidth} bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`}>
                {cellsArray.map((_,index) => (
                    <div key={index} className='bg-[#2424246b] rounded w-full aspect-square shadow-lg'/>
                ))}
            </div>
        </>
    )
}