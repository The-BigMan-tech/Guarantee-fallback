import UpperTop from "./upper-top/upper-top"
import ActionPane from "./action-pane/action-pane"

export default function Top({unFreezeStartup}:{unFreezeStartup:()=>string}) {
    return (
        <div className={`relative w-full h-[12%] ${unFreezeStartup()}`}>
            <UpperTop/>
            <ActionPane/>
        </div>
    )
}