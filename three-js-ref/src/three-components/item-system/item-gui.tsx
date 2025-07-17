import { useEffect, useMemo, useState ,useRef} from "react";
import { motion,AnimatePresence,easeInOut} from "motion/react"
import { isCellSelectedAtom, showItemGuiAtom } from "./item-state";
import { useAtom } from "jotai";
import { itemManager } from "./item-manager.three";
import type { ItemID } from "./item-manager.three";

type milliseconds = number;

export default function ItemGui() {
    const inventorySize:number = 8;
    const navCooldown:milliseconds = 100; // Cooldown in seconds.this value in particular works the best
    const navTimerRef = useRef<number>(0);

    const [hovered, setHovered] = useState(false);

    const [showItemGui] = useAtom(showItemGuiAtom);
    const [,setIsCellSelected] = useAtom(isCellSelectedAtom)//this controls the freezing of the player's controls when navigating about the grid

    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items');
    
    const [gridCols,setGridCols] = useState<number>(tab === 'Items'?3:1);
    const [gridWidth, setGridWidth] = useState(tab === 'Items' ? 20 : 10);
    
    const [cellNum,SetCellNum] = useState(tab === 'Items'?21:inventorySize);
    //strings are for valid ids,null keys are for padding and undefined are for invalid ids meaning no id is selected
    const [selectedCellID,setSelectedCellID] = useState<string | undefined>(undefined);

    const cellsArray:string[] = useMemo(()=>{ //used memo here to make it react to change in cell num.
        let cells:ItemID[] = (tab === "Items")
            ?Object.keys(itemManager.items)
            :Array.from(itemManager.inventoryItems.keys());
        if (cells.length < cellNum) {// Pad the array with nulls until it reaches cellNum length
            const padding:string[] = [];
            for (let i=0;i < (cellNum - cells.length);i++) {
                padding.push(`pad-${i}`)
            }
            cells = [...cells, ...padding];
        }
        return cells;
    },[cellNum,tab]) 

    const cellRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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
                SetCellNum(inventorySize);
            }
            //When toggling tabs, the new grids layout changes grid columns and cell count, so the current selectedCell might no longer be valid.so we reset the associated variables.
            setSelectedCellID(undefined);
            setIsCellSelected(false);
            return newTab
        })  
    }
    function selectCell(itemID:ItemID) { 
        setSelectedCellID(itemID);
        setIsCellSelected(true);
    }
    function selectedCellStyle(itemID:ItemID) {
        if (selectedCellID === itemID) {
            if (itemID.startsWith('pad')) {
                return  'border-4 border-[#eb7979]'
            }
            return 'border-4 border-[#ffffff]'
        }
    }

    useEffect(()=>{//i used key-up for natural debouncing
        function getCellIndex(itemID:ItemID) {
            return cellsArray.findIndex(id => id === itemID)
        }
        function moveSelection(offset: number) {
            console.log('selected Cell id 2:', selectedCellID);

            if (selectedCellID == undefined) return; // nothing selected
            const newIndex = getCellIndex(selectedCellID) + offset;
            console.log('selected cell id newIndex:', newIndex);
            if ((newIndex >= 0) && (newIndex < cellsArray.length)) {//only advance the selection when within bounds
                const newID = cellsArray[newIndex];
                setSelectedCellID(newID);
                setIsCellSelected(true);
            }
        }
        function handleGridNav(event:KeyboardEvent) {
            if (event.code == 'KeyE') {
                setSelectedCellID(undefined);
                setIsCellSelected(false);
            }else {
                if (event.code == 'ArrowRight') moveSelection(1);
                else if (event.code == 'ArrowLeft') moveSelection(-1);
                else if (event.code == 'ArrowUp') moveSelection(-gridCols);
                else if (event.code == 'ArrowDown') moveSelection(gridCols);
            }
        }
        function handleKeyDown(event:KeyboardEvent) {
            if (selectedCellID) event.preventDefault();
            const now = performance.now();
            if (now - navTimerRef.current > navCooldown) {
                handleGridNav(event);
                navTimerRef.current = now;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        
    },[setIsCellSelected,gridCols,cellsArray,selectedCellID]);


    const ANIMATION_CONFIG = useMemo(() => ({
        buttonDiv: {
            initial: { opacity: 0, y: -40 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 40 },
            transition: { duration: 0.1, ease: easeInOut }
        },
        grid: {
            initial: { opacity: 0, y: -40 },
            animate: { opacity: 1, y: 0, width: `${gridWidth}%` },
            exit: { opacity: 0, y: 40 },
            transition: { duration: 0.3, ease: easeInOut }
        },
        button: {
            onHoverStart: () => setHovered(true),
            onHoverEnd: () => setHovered(false),
            whileHover: { scale: 1.1 }
        }
    }), [gridWidth]);
    
    useEffect(() => {
        if (!selectedCellID) return;
        const el = cellRefs.current[selectedCellID];
        if (el) {// Only scroll if the element exists
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedCellID]);
    //i wanted to use a sigle motion.div to animate the gui on exit and entry to prevent duplication but it didnt work.it is still neat the way it is and also,i can give them unique values in their animations
    //the key used for the motion divs helps React to identify the element for transition.they must be stable
    return <>
        <AnimatePresence>
            {showItemGui
                ?<>
                    <motion.div key="div1" className="absolute z-20 top-[2%] left-[4%]" {...ANIMATION_CONFIG.buttonDiv}>
                        <motion.button className=" w-[9.5vw] py-[4%] shadow-sm cursor-pointer bg-[#5858588e] hover:bg-[#48372bb1] font-[Consolas] font-bold text-[#fffffffd] " onClick={toggleTab} {...ANIMATION_CONFIG.button}>
                            {hovered ? "Switch" : tab }
                        </motion.button>
                    </motion.div>

                    <motion.div key="div2" className={`grid h-[90%] grid-cols-${gridCols} absolute z-20 top-[8%] left-[4%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`} {...ANIMATION_CONFIG.grid}>
                        {cellsArray.map((itemID) => (
                            <button 
                                onClick={()=>selectCell(itemID)} 
                                key={itemID} 
                                className={`bg-[#2424246b] rounded w-full aspect-square shadow-lg cursor-pointer ${selectedCellStyle(itemID)}`}
                                ref={el => { cellRefs.current[itemID] = el; }}
                                >
                                {(tab == "Items")
                                    ?<div>{itemManager.items[itemID]?.name}</div>
                                    :<div>{itemManager.inventoryItems.get(itemID)?.item.name}</div>
                                }
                            </button>
                        ))}
                    </motion.div>
                </>
                :null
            }
        </AnimatePresence>
    </>
}