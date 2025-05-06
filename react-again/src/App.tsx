import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"
import Body from "./components/body/body"

function App() {
    return (
        <div className="flex flex-col h-[100vh] w-[100vw] bg-[#1f1f30] text-white">
            <Toasts/>
            <Top/>
            <div className="flex w-full h-full items-center">
                <Sidebar/>  
                <Body/>
            </div>
        </div>
    )
}
export default App
