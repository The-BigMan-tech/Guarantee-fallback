import { useMemo, useState } from "react";
import { motion,AnimatePresence } from "motion/react"
import { showItemGuiAtom } from "./item-state";
import { useAtom } from "jotai";

export default function ItemGui() {
    const [showItemGui] = useAtom(showItemGuiAtom);
    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items');
    const [gridCols,setGridCols] = useState<number>(tab === 'Items'?3:1);
    const [gridWidth, setGridWidth] = useState(tab === 'Items' ? 20 : 10);
    const [cellNum,SetCellNum] = useState(tab === 'Items'?21:8);
    const cellsArray:null[] = useMemo(()=>new Array(cellNum).fill(null),[cellNum])//used memo here to make it react to change in cell num.

    const [hovered, setHovered] = useState(false);

    function toggleTab() {
        setTab((prev)=>{
            const newTab =(prev=="Inventory")?'Items':"Inventory"
            if (newTab =="Items") {
                setGridCols(3);
                setGridWidth(20);
                SetCellNum(21);
            }else {
                setGridCols(1);
                setGridWidth(10);
                SetCellNum(8);
            }
            return newTab
        })  
    }
    //i wanted to use a sigle motion.div to animate the gui on exit and entry to prevent duplication but it didnt work.it is still neat the way it is and also,i can give them unique values in their animations
    return <>
        <AnimatePresence>
            {showItemGui
                ?<>
                    <motion.div 
                        key="itemGui2"//this helps React to identify the element for transition.
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                        className="absolute z-20 top-[2%] left-[4%]">
                            <motion.button 
                                onHoverStart={() => setHovered(true)}
                                onHoverEnd={() => setHovered(false)}
                                whileHover={{ scale: 1.1 }}
                                className=" w-[9.5vw] py-[4%] shadow-sm cursor-pointer bg-[#5858588e] hover:bg-[#48372bb1] font-[Consolas] font-bold text-[#fffffffd] " onClick={toggleTab}>
                                    {hovered ? "Switch" : tab }
                            </motion.button>
                    </motion.div>

                    <motion.div    
                        key="itemGui"//this helps React to identify the element for transition.
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0, width: `${gridWidth}%` }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`grid h-[90%] grid-cols-${gridCols} absolute z-20 top-[8%] left-[4%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`}>
                            {cellsArray.map((_,index) => (
                                <div key={index} className='bg-[#2424246b] rounded w-full aspect-square shadow-lg'/>
                            ))}
                    </motion.div>
                </>
                :null
            }
        </AnimatePresence>
    </>
}