import { useEffect, useMemo, useState ,useRef} from "react";
import { motion,AnimatePresence,easeInOut} from "motion/react"
import { isCellSelectedAtom, showItemGuiAtom, toggleItemGui } from "./item-state";
import { useAtom } from "jotai";
import { itemManager } from "./item-manager.three";
import type { ItemID } from "./item-manager.three";
import Cell from "./cell";


type milliseconds = number;

const inventorySize:number = itemManager.invSize;
const nullCellIDPrefix = 'pad'//the prefix for ids of null/empty cells


export default function ItemGui() {
    const [,setItemGuiVersion] = useState(0)//this is a dummy state to force react to rerender.i dont need to read it which is why i only have a setter

    const navCooldown:milliseconds = 100; 
    const navTimerRef = useRef<number>(0);

    const actionCooldown:milliseconds = 150; 
    const actionTimerRef = useRef<number>(0);

    const [hovered, setHovered] = useState(false);
    const [cellHovered, setCellHovered] = useState<string>('');

    const [showItemGui] = useAtom(showItemGuiAtom);
    const [tab,setTab] = useState<'Items' | 'Inventory'>('Items');
    
    const [gridCols,setGridCols] = useState<number>(tab === 'Items'?3:1);
    const [gridWidth, setGridWidth] = useState(tab === 'Items' ? 20 : 10);
    const [gridColClass,setGridColClass] = useState<string>(tab === 'Items'?'grid-cols-3':'grid-cols-1');
    
    const [cellNum,SetCellNum] = useState(tab === 'Items'?21:inventorySize);
    const [selectedCellID,setSelectedCellID] = useState<string | undefined>(undefined);
    const [,setIsCellSelected] = useAtom(isCellSelectedAtom)//this controls the freezing of the player's controls when navigating about the grid

    const cellRefs = useRef<Record<string,HTMLButtonElement | null >>({});
    const [cellsArray,setCellsArray] = useState<string[]>([]) 
    
    //this is a slice into the cells array used progressive/incremental loading for perf and ux
    const visibleCellsIncrement:number = useMemo(()=>gridCols,[gridCols]);
    const [visibleCellCount, setVisibleCellCount] = useState(visibleCellsIncrement);
    const incrementDelay:milliseconds = 60; 

    const visibleCells = useMemo(() => cellsArray.slice(0, visibleCellCount), [cellsArray, visibleCellCount]);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    function setHoveredCell(value:string) {//passed wrapper as prop to avoid unintended mutation by children
        setCellHovered(value)
    }
    function toggleTab() {
        setTab((prev)=>{
            const newTab =(prev=="Inventory")?'Items':"Inventory"
            if (newTab =="Items") {
                setGridCols(3);
                setGridWidth(20);
                SetCellNum(21);
                setGridColClass('grid-cols-3');//i resorted to using a static class name instead of dynamic tem class names because it always caused issues when vite optimized my bundle which probbaly prurged unused styles and my dynamic ones werent included
            }else {
                setGridCols(1);
                setGridWidth(10);
                SetCellNum(inventorySize);
                setGridColClass('grid-cols-1');
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
            return 'shadow-xl border-3 border-[#00000020]'
        }else {
            return ''
        }
    }
    function handleDragStart(index:number) {
        dragItem.current = index;
        console.log('Drag index 1:', index);
    };
    function handleDragEnter(index:number) {
        dragOverItem.current = index;
        console.log('Drag index 2:', index);
    };
    function handleDrop(e:React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        if ((dragItem.current == null) || (dragOverItem.current == null)) return;
        setCellsArray(prev => {//reinsert the dragged item
            const arr = [...prev];
            const [removed] = arr.splice(dragItem.current!, 1);
            arr.splice(dragOverItem.current!, 0, removed);
            return arr;
        });
        dragItem.current = null;
        dragOverItem.current = null;
    };


    useEffect(()=>{ //used memo here to make it react to change in cell num.
        let cells:ItemID[] = (tab === "Items")
            ?Object.keys(itemManager.items)
            :Array.from(itemManager.inventory.keys());

        if (cells.length < cellNum) {// Pad the array with nulls until it reaches cellNum length
            const padding:string[] = [];
            for (let i=0;i < (cellNum - cells.length);i++) {
                padding.push(`${nullCellIDPrefix}${i}`)
            }
            cells = [...cells, ...padding];
        }
        setCellsArray(cells)
    },[cellNum,tab]) 


    useEffect(() => {
        if (visibleCellCount < cellsArray.length) {
            const timeOut = setTimeout(() => {
                setVisibleCellCount(count => Math.min(count + visibleCellsIncrement, cellsArray.length));//capped it to the cells array length to prevent out of bounds
            },incrementDelay);
            return () => clearTimeout(timeOut);
        }
    }, [visibleCellCount, cellsArray,visibleCellsIncrement]);


    useEffect(() => {//reset the visible cell count whenever the data source changes to prevent rendering the list all at once when the list changes cuz list change will cause a rerender
        setVisibleCellCount(visibleCellsIncrement);
    }, [cellsArray, tab,visibleCellsIncrement]);


    useEffect(() => {//this is to scroll the grid to the view of the currently selected cell
        if (!selectedCellID) return;
        const el = cellRefs.current[selectedCellID];
        if (el) {// Only scroll if the element exists
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedCellID]);

    
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
        function navGrid(event:KeyboardEvent) {
            if (event.code == 'KeyE') {//i used the same key for both toggling off the item gui and deselecting a cell for good ux.
                setSelectedCellID(undefined);
                setIsCellSelected(false);
                if (selectedCellID) toggleItemGui();//i did this to cancel out the effect of the E-key listener in the player class so that pressing E when a cell is selected,only deselects the cell and the gui will only close when E is pressed and there is no cell selected
            }else {
                if (event.code == 'ArrowRight') moveSelection(1);
                else if (event.code == 'ArrowLeft') moveSelection(-1);
                else if (event.code == 'ArrowUp') moveSelection(-gridCols);
                else if (event.code == 'ArrowDown') moveSelection(gridCols);
            }
        }
        function handleKeyDown(event:KeyboardEvent) {//ised a single key listener to prevent conflict or eating up of events between multiple listeners
            if (selectedCellID) event.preventDefault();
            const now = performance.now();
            if ((now - navTimerRef.current) > navCooldown) {
                navGrid(event);
                navTimerRef.current = now;
            }
            if ((now - actionTimerRef.current) > actionCooldown) {
                if (selectedCellID && !selectedCellID.startsWith(nullCellIDPrefix)) {//this is to prevent null pads from causing erros since their ids arent present in the actual item list
                    if ((tab === 'Items' ) && (event.code === 'Enter') ) {
                        itemManager.addToInventory(selectedCellID);
                        setItemGuiVersion(prev=>prev+1);//to force react to rerender to imperative inventory update that exists outside of react's render loop
                    }
                    else if ((tab === 'Inventory' ) && (event.code === 'Backspace') ) {
                        itemManager.removeFromInventory(selectedCellID);
                        setItemGuiVersion(prev=>prev+1);
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        
    },[setIsCellSelected,gridCols,cellsArray,selectedCellID,tab]);



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
        },
    }), [gridWidth]);


    //i wanted to use a sigle motion.div to animate the gui on exit and entry to prevent duplication but it didnt work.it is still neat the way it is and also,i can give them unique values in their animations
    //the key used for the motion divs helps React to identify the element for transition.they must be stable
    return <>
        <AnimatePresence>
            {showItemGui
                ?<>
                    <motion.div key="div1" className="absolute z-20 top-[2%] left-[4%]" {...ANIMATION_CONFIG.buttonDiv}>
                        <motion.button className=" w-[9.5vw] py-[4%] shadow-sm cursor-pointer bg-[#2c2c2ca4] hover:bg-[#48372bb1] font-[Consolas] font-bold text-[#fffffffd] " onClick={toggleTab} {...ANIMATION_CONFIG.button}>
                            {hovered ? "Switch" :tab}
                        </motion.button>
                    </motion.div>

                    <motion.div key="div2" className={`grid h-[90%] ${gridColClass} absolute z-20 top-[8%] left-[4%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl custom-scrollbar`} {...ANIMATION_CONFIG.grid}>
                        {visibleCells.map((itemID,index) => (
                            <div 
                                draggable={tab == "Inventory"} 
                                onDragStart={() => handleDragStart(index)} 
                                onDragEnter={() => handleDragEnter(index)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                className={dragOverItem.current == index?'border border-red-500':''}
                                >
                                <Cell  key={itemID} {...{
                                    itemID,
                                    selectedCellID,
                                    tab,
                                    cellHovered,
                                    setHoveredCell,
                                    selectedCellStyle,
                                    selectCell,
                                    cellRefs
                                }}/>
                            </div>
                        ))}
                    </motion.div>
                </>
                :null
            }
        </AnimatePresence>
    </>
}