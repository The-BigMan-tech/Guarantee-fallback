export default function SearchBar() {
    return (
        <div className="bg-[#2b2d46] w-full border-b border-slate-400 shadow-sm py-[1%] flex items-center">
            <input className="bg-[#4a4e7a] relative left-[68%] py-2 pl-4 w-[30%] outline-none text-white rounded-xl" type="text" placeholder="File search" />
        </div>
    )
}