import {motion} from "motion/react"
import { itemManager, type ItemID } from "./item-manager.three";
import { useEffect, useMemo,useState,memo,type RefObject } from "react";

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
    const multiplierStyle:style = "absolute top-[3%] right-[4%] font-semibold text-[#e3fcd8]";
    const itemCount = (itemManager.inventory.has(itemID) && `x ${itemManager.inventory.get(itemID)?.count}`) || ''
    const stackfullText:string | null = (itemManager.isStackFull(itemID)?'Full':null);//to indicate the inv is full.i only used this indicator in the main item grid to signal it to playrs when adding items from it to their inv but the inv itself will always show the item count
    const itemNameStyle:style = "font-mono font-semibold text-sm"

    const ANIMATION_CONFIG = useMemo(() => ({
        cell: {
            whileHover:(!selectedCellID) ? { //only do hover animation only when a cell isnt selected to prevent two cells from being emphasized at the same time
                scale: 1.15,
                backgroundColor:"#2c2c2ca4"
            } : {}
        }
    }), [selectedCellID]);


    const [src, setSrc] = useState<string | undefined>(undefined);//i used undefined here to prevent react from throwing errors that i cant use an empty string as the src even though my app didnt crash from it.
    useEffect(() => {//i delayed the loading of the img to prevent it from disturbing the mounting animation of the cell because of initial layout shift
        const timer = setTimeout(() => {
            setSrc(itemManager.items[itemID]?.imagePath);
        }, 100);
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
                {/*only render the image if on the items tab or if we are in the inventory tab but the count is greater than 0.this is to avoid the image from lingering the inv */}
                {(tab == "Items") || ((itemManager.inventory.get(itemID)?.count || 0) > 0) 
                    ?<img src={src} className={`w-[75%] relative left-[10%]`} draggable={false}/>
                    :null
                }
                {(tab == "Items")
                    ?<div className="text-sm">
                        <div className={itemNameStyle}>{itemManager.items[itemID]?.name}</div>
                        {((selectedCellID==itemID) || (cellHovered==itemID))
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