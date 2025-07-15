export default function ItemGui() {
    const numCells = 21;
    const cellsArray:null[] = new Array(numCells).fill(null);
    return (
        <div className="grid grid-cols-3 h-[60%] absolute z-20 top-[30%] left-[5%] w-[20%] bg-[#ffffff2d] shadow-md">
            {cellsArray.map((_,index) => (
                <div key={index} className="bg-[#3838386b] border border-gray-700 rounded m-[3%]"/>
            ))}
        </div>
    )
}