import { useAtom } from "jotai";
import { isCellSelectedAtom, registerIsCellSelectedGetter, registerIsCellSelectedSetter, registerShowItemGuiGetter, registerShowItemGuiSetter, registerRefreshGuiGetter, registerRefreshGuiSetter, showItemGuiAtom,refreshGuiAtom } from "./item-state";
import { useEffect } from "react";

export default function ItemStateRegister() {
    const [showItemGui,showItemGuiSetter] = useAtom(showItemGuiAtom);
    const [isCellSelected,cellIsSelectedSetter] = useAtom(isCellSelectedAtom);
    const [refreshGui,refreshGuiSetter] = useAtom(refreshGuiAtom);

    useEffect(() => {
        registerShowItemGuiSetter(showItemGuiSetter);
        registerShowItemGuiGetter(()=>showItemGui);

        registerIsCellSelectedSetter(cellIsSelectedSetter);
        registerIsCellSelectedGetter(()=>isCellSelected);

        registerRefreshGuiSetter(refreshGuiSetter);
        registerRefreshGuiGetter(()=>refreshGui);
    }, [showItemGuiSetter,showItemGui,isCellSelected,cellIsSelectedSetter,refreshGui,refreshGuiSetter]);

    return null
}