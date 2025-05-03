import Body from "./components/body/body"
import Details from "./components/details/details"
import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"

function App() {
    return (
        <div className="flex h-[100vh] w-[100vw] gap-[0.7%] bg-[#242438] text-white ">
            <Sidebar/>  
            <div className="flex flex-col w-full">
                <Top/>
                <div className="flex h-[84.5%] border-t border-blue-800 gap-[0.8%]">
                    <Body/>
                    <Details/>
                </div>
            </div>
        </div>
    )
}
export default App
