import Sidebar from "./components/sidebar/sidebar"
import Top from "./components/top/top"
import Toasts from "./components/toast/toast"

function App() {
    return (
        <div className="flex flex-col h-[100vh] w-[100vw] bg-[#1f1f30] text-white">
            <Toasts/>
            <Top/>
            <div className="flex w-full h-full">
                <Sidebar/>  
            </div>
        </div>
    )
}
export default App
