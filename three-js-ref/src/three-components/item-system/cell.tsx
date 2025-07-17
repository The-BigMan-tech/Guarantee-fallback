import {motion} from "motion/react"
import { itemManager, type ItemID } from "./item-manager.three";
import { useEffect, useMemo, useRef } from "react";

interface Props {
    itemID:ItemID,
    selectedCellID:ItemID | undefined,
    tab:'Items' | 'Inventory',
    cellHovered: string,
    selectCell:(itemID:ItemID)=>void,
    selectedCellStyle:(itemID:ItemID)=>string,
    setHoveredCell:(value:string)=>void
}
export default function Cell({itemID,selectedCellID,selectCell,selectedCellStyle,tab,cellHovered,setHoveredCell}:Props) {
    const cellRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
    
    const ANIMATION_CONFIG = useMemo(() => ({
        cell: {
            whileHover:(!selectedCellID) ? { 
                scale: 1.15,
                backgroundColor:"#2c2c2ca4"
            } : {}//only do hover animation only when a cell isnt selected to prevent two cells from being emphasized at the same time
        }
    }), [selectedCellID]);

    useEffect(() => {//this is to scroll the grid to the view of the currently selected cell
        if (!selectedCellID) return;
        const el = cellRefs.current[selectedCellID];
        if (el) {// Only scroll if the element exists
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedCellID]);

    return (
        <motion.button 
            onClick={()=>selectCell(itemID)} 
            key={itemID} 
            className={`relative rounded w-full aspect-square shadow-lg cursor-pointer text-white ${selectedCellStyle(itemID)}`}
            ref={el => { cellRefs.current[itemID] = el; }}
            onHoverStart={() => setHoveredCell(itemID)}
            animate= { // the reason why i didnt include this in the config as well is because i need to check a specifc property of a particular cell which can only be accessed withing the map rendering.
                selectedCellID === itemID
                ? { scale: 1.11, backgroundColor: "#2c2c2ca4" }
                : { scale: 1, backgroundColor: "#2424246b" }
            }
            {...ANIMATION_CONFIG.cell}
            >
            {(tab == "Items")
                ?<div>
                    <div>{itemManager.items[itemID]?.name}</div>
                    <div className="absolute bottom-[3%] right-[8%] text-sm">{
                        ((selectedCellID==itemID) || (cellHovered==itemID)) &&  
                        itemManager.inventory.has(itemID) &&
                        `x ${itemManager.inventory.get(itemID)?.count}`
                    }</div>
                </div>
                :<div>
                    <div>{itemManager.inventory.get(itemID)?.item.name}</div>
                    <div className="absolute bottom-[3%] right-[8%] text-sm">{itemManager.inventory.get(itemID)?.count}</div>
                </div>
            }
        </motion.button>
    )
}