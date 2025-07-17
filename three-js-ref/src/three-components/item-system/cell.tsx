import {motion} from "motion/react"
import { itemManager, type ItemID } from "./item-manager.three";
import { useEffect, useMemo,useState,type RefObject } from "react";

type style = string;

interface Props {
    itemID:ItemID,
    selectedCellID:ItemID | undefined,
    tab:'Items' | 'Inventory',
    cellHovered: string,
    cellRefs:RefObject<Record<string, HTMLButtonElement | null>>,
    selectCell:(itemID:ItemID)=>void,
    selectedCellStyle:(itemID:ItemID)=>string,
    setHoveredCell:(value:string)=>void
}
export default function Cell({itemID,selectedCellID,selectCell,selectedCellStyle,tab,cellHovered,setHoveredCell,cellRefs}:Props) {
    const multiplierStyle:style = "absolute top-[3%] right-[4%] font-semibold";
    const itemCount = (itemManager.inventory.has(itemID) && `x ${itemManager.inventory.get(itemID)?.count}`) || ''
    
    const ANIMATION_CONFIG = useMemo(() => ({
        cell: {
            whileHover:(!selectedCellID) ? { //only do hover animation only when a cell isnt selected to prevent two cells from being emphasized at the same time
                scale: 1.15,
                backgroundColor:"#2c2c2ca4"
            } : {}
        }
    }), [selectedCellID]);


    const [src, setSrc] = useState("");
    useEffect(() => {//i delayed the loading of the img to prevent it from disturbing the mounting animation of the cell because of initial layout shift
        const timer = setTimeout(() => {
            setSrc(itemManager.items[itemID]?.imagePath);
        }, 100);
        return () => clearTimeout(timer);
    }, [itemID]);


    return (
        <motion.button 
            onClick={()=>selectCell(itemID)} 
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
            <img
                src={src}
                className="w-[80%] relative left-[10%] "
                draggable={false}
            />
            {(tab == "Items")
                ?<div className="text-sm">
                    <div>{itemManager.items[itemID]?.name}</div>
                    <div className={multiplierStyle}>{
                        ((selectedCellID==itemID) || (cellHovered==itemID)) &&  
                        `${itemCount}`
                    }</div>
                </div>
                :<div>
                    <div>{itemManager.inventory.get(itemID)?.item.name}</div>
                    <div className={multiplierStyle}>{`${itemCount}`}</div>
                </div>
            }
        </motion.button>
    )
}