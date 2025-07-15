export default function ItemGui() {
    const numCells = 21;
    const cellsArray:null[] = new Array(numCells).fill(null);

    return (
        <>
            <div className="absolute z-20 top-[2.5%] left-[4%] flex items-center gap-[25%] font-[Consolas] font-bold text-[#fcfcfcef] ">
                <button className="bg-[#2e2e2eb3] py-[4%] px-[15%] shadow-sm">Items</button>
                <button>Inventory</button>
            </div>
            <div className="grid grid-cols-3 h-[90%] absolute z-20 top-[8%] left-[4%] w-[20%] bg-[#ffffff2d] shadow-md pt-[0.4%] pb-[0.4%] pl-[0.5%] pr-[0.5%] gap-[2%] overflow-y-scroll rounded-b-xl">
                {cellsArray.map((_,index) => (
                    <div key={index} className="bg-[#2424246b] rounded w-full aspect-square shadow-lg"/>
                ))}
            </div>
        </>
    )
}