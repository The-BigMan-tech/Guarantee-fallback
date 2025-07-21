import {motion} from "motion/react"
import { itemManager } from "./item-manager.three";
import type { ItemID } from "./item-defintions";
import { useEffect, useMemo,useState,memo,type RefObject, useCallback } from "react";

type style = string;

interface Props {
    itemGuiVersion:number
    itemID:ItemID,
    selectedCellID:ItemID | undefined,
    tab:'Items' | 'Inventory',
    cellHovered: string,
    cellRefs:RefObject<Record<string, HTMLButtonElement | null>>,
    index:number,
    selectCell:(itemID:ItemID)=>void,
    selectedCellStyle:(itemID:ItemID)=>string,
    setHoveredCell:(value:string)=>void,
    handleDragEnter: (index: number) => void,
    handleDragStart: (index: number) => void,
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
}
function areEqual(prev: Props, next: Props) {
    return (//Dont rerender only if:
        prev.itemGuiVersion == next.itemGuiVersion &&//no changes to external data that isnt managed by react but imperatively like the inventory data,were made.
        prev.itemID === next.itemID &&//its the same cell at that index
        prev.selectedCellID === next.selectedCellID &&//the selected cell remains the same
        prev.tab === next.tab &&//the gui tab is the same
        prev.index === next.index &&
        prev.cellHovered == next.cellHovered &&

        prev.selectCell === next.selectCell &&//the function refs are the same.even if the defintions remain stable,we still need to check for this to prevent subtle bugs when referencing an old closure
        prev.setHoveredCell === next.setHoveredCell &&
        prev.selectedCellStyle === next.selectedCellStyle &&

        prev.handleDragStart === next.handleDragStart &&
        prev.handleDragEnter === next.handleDragEnter &&
        prev.handleDrop === next.handleDrop
         //we can ignore cell refs because the refs to the cells always remains the same
    );
}
const Cell = memo( ({itemID,selectedCellID,selectCell,selectedCellStyle,tab,cellHovered,setHoveredCell,cellRefs,handleDragEnter,handleDragStart,handleDrop,index}:Props)=>{
    console.log('Drag Rendering Cell for:',itemID);
    
    const multiplierStyle:style = "absolute top-[3%] right-[4%] font-semibold font-[Consolas]";
    const itemCount = (itemManager.inventory.has(itemID) && `x ${itemManager.inventory.get(itemID)?.count}`) || ''
    const stackfullText:string | null = (itemManager.isStackFull(itemID)?'Full':null);//to indicate the inv is full.i only used this indicator in the main item grid to signal it to playrs when adding items from it to their inv but the inv itself will always show the item count
    const itemNameStyle:style = "font-mono font-semibold text-sm"

    const holdingItemInCell = (itemManager.itemInHand?.itemID === itemID)

    const selectedCellBackground = useCallback(()=> {
        if (selectedCellID === itemID) {//this is the style of a cell when we select it
            return { scale: 1.11, backgroundColor: "#2c2c2ca4" }
        }
        //so the effect of this is to highlight the selected inventory item after the user has switched away from grid mode.this is because switching away from grid mode deselects the cell.so we need to apply some sort of style so that the character knows which item he is holding even though he deselected the cell to switch out of grid mode and start moving
        else if (tab=="Inventory" && !selectedCellID && holdingItemInCell) {//so what this does is that if the user is in the inventory,and the item in this cell is what he is holding,highlight it BUT we only want to highlight it this color when the user has deselected the cell to exit grid mode.thats why i added !selectedCellID.because if not,this style will apply to any item he selects in the inv not when he exited grid mode.
            return { scale: 1.11, backgroundColor: "#333d32a0" }
        }
        else {//this is the style of a cell when it isnt selected
            return { scale: 1, backgroundColor: "#2424246b" }
        }
    },[itemID,selectedCellID,tab,holdingItemInCell])


    const ANIMATION_CONFIG = useMemo(() => ({
        cell: {
            animate:selectedCellBackground(),
            whileHover:(!selectedCellID && !holdingItemInCell) ? { //only do hover animation only when a cell isnt selected to prevent two cells from being emphasized at the same time.we also dont want to override the style of the cell if the user is holding an item from it which is why i added the second check.
                scale: 1.15,
                backgroundColor:"#2c2c2ca4"
            } : {}
        }
    }), [selectedCellID,selectedCellBackground,holdingItemInCell]);


    const [src, setSrc] = useState<string | undefined>(undefined);//i used undefined here to prevent react from throwing errors that i cant use an empty string as the src even though my app didnt crash from it.
    useEffect(() => {//i delayed the loading of the img to prevent it from disturbing the mounting animation of the cell because of initial layout shift
        const timer = setTimeout(() => {
            setSrc(itemManager.items[itemID]?.imagePath);
        },50);
        return () => clearTimeout(timer);
    }, [itemID]);

    

    return (
        <div 
            draggable={tab == "Inventory"} 
            onDragStart={()=>handleDragStart(index)} 
            onDragEnter={()=>handleDragEnter(index)}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            >
            <motion.button 
                onClick={()=>selectCell(itemID)} 
                onKeyDown={e => {if (e.key === ' ') e.preventDefault();}}//to prevent cells from being selected with space bar
                className={`relative rounded w-full aspect-square shadow-lg cursor-pointer text-white ${selectedCellStyle(itemID)}`}
                ref={el => { cellRefs.current[itemID] = el; }}
                onHoverStart={() => setHoveredCell(itemID)}
                {...ANIMATION_CONFIG.cell}
                >
                    {/*only render the image if on the items tab or if we are in the inventory tab but the count is greater than 0.this is to avoid the image from lingering the inv */}
                    {(tab == "Items") || ((itemManager.inventory.get(itemID)?.count || 0) > 0) 
                        ?<img src={src} className={`w-[75%] relative left-[15%]`} draggable={false}/>
                        :null
                    }
                    {(tab == "Items")
                        ?<div className="text-sm">
                            <div className={itemNameStyle}>{itemManager.items[itemID]?.name}</div>
                            {((selectedCellID==itemID) || (cellHovered==itemID))//we want to show the item count if we are selecting that cell or if we are hovering over it
                                ?<div className={multiplierStyle}>{stackfullText || itemCount}</div>
                                :null
                            }
                        </div>
                        :<div>
                            <div className={itemNameStyle}>{itemManager.inventory.get(itemID)?.item.name}</div>
                            <div className={multiplierStyle}>{`${itemCount}`}</div>
                        </div>
                    }
            </motion.button>
        </div>
    )
},areEqual)
export default Cell;