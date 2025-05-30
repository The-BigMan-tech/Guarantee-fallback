import { FsNodeComponent } from "./fs-node"
import { FsNode } from "../../utils/rust-fs-interface"
import { useState,useEffect, useRef, useMemo } from "react"
import { selectIsDisplayingCache, selectSearchResultLen } from "../../redux/selectors";
import { selector } from "../../redux/hooks";
import { memConsoleLog } from "../../utils/log-config";

interface Props {
    fsNodes:FsNode[] | null,
}
export default function FsDisplay({fsNodes}:Props) {
    const onSearch = selector(store=>selectSearchResultLen(store));
    const displayingCache = selector(store=>selectIsDisplayingCache(store));
    const INCREMENT = 5;          // number of items to add each step
    const DELAY_MS = 300;        // delay between increments (ms)
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(10); // initial items to show.
    const visibleNodes = useMemo(()=>(!onSearch && !displayingCache)?fsNodes?.slice(0,visibleCount) || []:fsNodes,[fsNodes,visibleCount,onSearch,displayingCache])

    useEffect(() => {
        memConsoleLog("CAffgff");
        if (onSearch || displayingCache) return
        if (fsNodes && (visibleCount <= fsNodes.length)) {
            const timer = setTimeout(() => {
                setVisibleCount((prev) => Math.min(prev + INCREMENT, fsNodes.length));
            }, DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [visibleCount,fsNodes,onSearch,displayingCache]);

    useEffect(()=>{
        if (!containerRef.current) return
        containerRef.current.scrollTop = 0
        if (onSearch || displayingCache) return;
        setVisibleCount(10)
    },[fsNodes,onSearch,displayingCache])

    return (
        <>  
            {visibleNodes?.length//if there is content,render the fs components
                ?<div ref={containerRef} className='grid sm:grid-cols-4 md:grid-cols-5 h-auto pb-10 pt-5 max-h-[96%] gap-x-[1.2%] gap-y-[5%] mt-[2%] w-[100%] overflow-y-scroll overflow-x-hidden items-center justify-center'>
                    {visibleNodes.map((fsNode)=>
                        <FsNodeComponent key={fsNode.primary.nodePath} {...{fsNode}}/>
                    )}
                </div>
                :<div className="self-center justify-self-center relative top-[40vh] text-2xl font-[Consolas]">
                    {fsNodes?.length == 0//if its still loading/if the list variable is an empty array,
                        ?<h1 className="text-[#91b6ee]">Loading content...</h1>
                        :<h1>There is no content</h1>//if it loaded but its empty/if the list variable is null
                    }
                </div>
            }
        </>
    )
}