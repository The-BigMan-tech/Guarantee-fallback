export default function Sidebar() {
    return (
        <div className="flex flex-col bg-[#282a4a] h-[98%] w-[22%] border-r-2 border-slate-400">
            <div className="border-b-2 border-slate-400 h-[9.5%] content-center">
                <h1 className="font-semibold font-[Consolas]  relative left-[2%] sm:text-sm lg:text-lg">File manager</h1>
            </div>
            <h1 className="text-transparent">Hello sidebar</h1>
        </div>
    )
}