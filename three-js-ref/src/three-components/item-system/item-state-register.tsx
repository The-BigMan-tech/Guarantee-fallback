import { useAtom } from "jotai";
import { isCellSelectedAtom, registerIsCellSelectedGetter, registerIsCellSelectedSetter, registerShowItemGuiGetter, registerShowItemGuiSetter, showItemGuiAtom } from "./item-state";
import { useEffect } from "react";

export default function ItemStateRegister() {
    const [showItemGui,showItemGuiSetter] = useAtom(showItemGuiAtom);
    const [isCellSelected,cellIsSelectedSetter] = useAtom(isCellSelectedAtom);

    useEffect(() => {
        registerShowItemGuiSetter(showItemGuiSetter);
        registerShowItemGuiGetter(()=>showItemGui);

        registerIsCellSelectedSetter(cellIsSelectedSetter);
        registerIsCellSelectedGetter(()=>isCellSelected);
    }, [showItemGuiSetter,showItemGui,isCellSelected,cellIsSelectedSetter]);

    return null
}