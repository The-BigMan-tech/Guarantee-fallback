import { FC,memo} from "react"

interface Props {
    id:string,
    tabName:string,
    imgName:string,
    clickedTab:string,
    clickTab:(tabId:string,tabName:string)=>Promise<void>,
    clickedClass:(tabId:string)=>string
}
const areEqual = (prevProps: Props, nextProps: Props) => {
    return prevProps.id === nextProps.id &&
        prevProps.tabName === nextProps.tabName &&
        prevProps.imgName === nextProps.imgName &&
        prevProps.clickedTab === nextProps.clickedTab
};
export const  Card:FC<Props> = memo(({id,tabName,imgName,clickTab,clickedClass})=> {
    return (
        <button onClick={async ()=>await clickTab(id,tabName)} className={`flex items-center cursor-pointer text-left pl-8 text-sm  ${clickedClass(id)}`}>
            <img className="w-3 relative right-4 shrink-0" src={`./assets/${imgName}`} alt="" />
            <h1>{tabName}</h1>
        </button>
    )
},areEqual)