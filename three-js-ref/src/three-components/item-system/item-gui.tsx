import { useEffect, useMemo, useState } from "react";
import { motion,AnimatePresence,easeInOut} from "motion/react"
import { isCellSelectedAtom, showItemGuiAtom } from "./item-state";
import { useAtom } from "jotai";
import { itemManager } from "./item-manager.three";
import type { InventoryItem, Item } from "./item-manager.three";

export default function ItemGui() {
    const [showItemGui] = useAtom(showItemGuiAtom);
    const [,setIsCellSelected] = useAtom(isCellSelectedAtom)

    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items');
    const [gridCols,setGridCols] = useState<number>(tab === 'Items'?3:1);
    const [gridWidth, setGridWidth] = useState(tab === 'Items' ? 20 : 10);
    const [cellNum,SetCellNum] = useState(tab === 'Items'?21:8);
    //used memo here to make it react to change in cell num.

    const cellsArray = useMemo(()=>{
        let cells:(Item | InventoryItem)[] = [];
        if (tab === "Items") {
            cells = Object.values(itemManager.items);
        } else {
            cells = Array.from(itemManager.inventoryItems.values());
        }
        if (cells.length < cellNum) {// Pad the array with nulls until it reaches cellNum length
            cells = [...cells, ...new Array(cellNum - cells.length).fill(null)];
        }
        return cells;
    },[cellNum,tab]) 

    const [hovered, setHovered] = useState(false);
    const [selectedCell,setSelectedCell] = useState<number | undefined>(undefined);

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
            //When toggling tabs, the new grid layout changes grid columns and cell count, so the current selectedCell might no longer be valid.so we reset the associated variables.
            setSelectedCell(undefined);
            setIsCellSelected(false);
            return newTab
        })  
    }
    function selectCell(index:number) {
        setSelectedCell(index);
        setIsCellSelected(true);
    }
    function selectedCellStyle(index:number) {
        if (selectedCell === index) {
            return 'border-4 border-[#ffffff]'
        }
    }
    useEffect(()=>{//i used key-up for natural debouncing
        function handleKeyUp(event:KeyboardEvent) {
            if (event.code == 'Escape') {
                setSelectedCell(undefined);
                setIsCellSelected(false);
                return;
            }
            if (selectedCell !== undefined) {//this is safer than directly checking for falsiness because 0 is also falsy but its a valid index
                if (event.code == 'ArrowRight') {
                    setSelectedCell(prev=>{
                        if (prev == undefined) return prev;
                        const next = prev + 1;
                        return (next >= cellNum) ? prev : next; // prevent overflow
                    })
                }else if (event.code == 'ArrowLeft') {
                    setSelectedCell(prev=>{
                        if (prev == undefined) return prev;
                        const next = prev - 1;
                        return (next < 0) ? prev : next;
                    })
                }else if (event.code == 'ArrowUp') {
                    setSelectedCell(prev=>{
                        if (prev == undefined) return prev;
                        const next = prev - gridCols;
                        return  (next < 0) ? prev : next
                    })
                }else if (event.code == 'ArrowDown') {
                    setSelectedCell(prev=>{
                        if (prev == undefined) return prev;
                        const next = prev + gridCols;
                        return  (next >= cellNum) ? prev : next
                    })
                } 
            }
        }
        window.addEventListener('keyup',handleKeyUp);
        return () => {
            window.removeEventListener("keyup", handleKeyUp);
        };
        
    },[selectedCell,cellNum,setIsCellSelected,gridCols]);

    function ANIMATION_CONFIG(gridWidth?:number) {
        return {
            buttonDiv: {
                initial: { opacity: 0, y: -40 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 40 },
                transition: { duration: 0.1, ease:easeInOut}
            },
            grid: {
                initial: { opacity: 0, y: -40 },
                animate: { opacity: 1, y: 0, width: `${gridWidth}%` },
                exit: { opacity: 0, y: 40 },
                transition: { duration: 0.3, ease:easeInOut}
            },
            button: {
                onHoverStart:() => setHovered(true),
                onHoverEnd:() => setHovered(false),
                whileHover:{ scale: 1.1 }
            }
        }
    };
    
    //i wanted to use a sigle motion.div to animate the gui on exit and entry to prevent duplication but it didnt work.it is still neat the way it is and also,i can give them unique values in their animations
    //the key used for the motion divs helps React to identify the element for transition.they must be stable
    return <>
        <AnimatePresence>
            {showItemGui
                ?<>
                    <motion.div key="div1" className="absolute z-20 top-[2%] left-[4%]" {...ANIMATION_CONFIG().buttonDiv}>
                        <motion.button className=" w-[9.5vw] py-[4%] shadow-sm cursor-pointer bg-[#5858588e] hover:bg-[#48372bb1] font-[Consolas] font-bold text-[#fffffffd] " onClick={toggleTab} {...ANIMATION_CONFIG().button}>
                            {hovered ? "Switch" : tab }
                        </motion.button>
                    </motion.div>

                    <motion.div key="div2" className={`grid h-[90%] grid-cols-${gridCols} absolute z-20 top-[8%] left-[4%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`} {...ANIMATION_CONFIG(gridWidth).grid}>
                        {cellsArray.map((value,index) => (
                            <button onClick={()=>selectCell(index)} key={index} className={`bg-[#2424246b] rounded w-full aspect-square shadow-lg cursor-pointer ${selectedCellStyle(index)}`}>
                                
                            </button>
                        ))}
                    </motion.div>
                </>
                :null
            }
        </AnimatePresence>
    </>
}