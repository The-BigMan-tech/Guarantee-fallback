import { FC,memo} from "react"

interface Props {
    id:string,
    tabName:string,
    imgName:string,
    clickedTab:string,
    unFreezeStartup:()=>string,
    clickTab:(tabId:string,tabName:string)=>Promise<void>,
    clickedClass:(tabId:string)=>string
}
const areEqual = (prevProps: Props, nextProps: Props) => {
    return prevProps.clickedTab == nextProps.clickedTab
};
export const  Card:FC<Props> = memo(({id,tabName,imgName,clickTab,clickedClass,unFreezeStartup})=> {
    function shouldShowPointer() {
        return (unFreezeStartup() != "opacity-30")?"cursor-pointer":"cursor-default"
    }
    return (
        <button onClick={async ()=>await clickTab(id,tabName)} className={`flex items-center text-left pl-8 text-sm  ${clickedClass(id)} ${shouldShowPointer()}`}>
            <img className="w-3 relative right-4 shrink-0" src={`./assets/${imgName}`} alt="" />
            <h1>{tabName}</h1>
        </button>
    )
},areEqual)