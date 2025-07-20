import { useAtom } from "jotai";
import { isCellSelectedAtom, registerIsCellSelectedGetter, registerIsCellSelectedSetter, registerShowItemGuiGetter, registerShowItemGuiSetter, registerUsedItemGetter, registerUsedItemSetter, showItemGuiAtom, usedItemAtom } from "./item-state";
import { useEffect } from "react";

export default function ItemStateRegister() {
    const [showItemGui,showItemGuiSetter] = useAtom(showItemGuiAtom);
    const [isCellSelected,cellIsSelectedSetter] = useAtom(isCellSelectedAtom);
    const [usedItem,usedItemSetter] = useAtom(usedItemAtom);

    useEffect(() => {
        registerShowItemGuiSetter(showItemGuiSetter);
        registerShowItemGuiGetter(()=>showItemGui);

        registerIsCellSelectedSetter(cellIsSelectedSetter);
        registerIsCellSelectedGetter(()=>isCellSelected);

        registerUsedItemSetter(usedItemSetter);
        registerUsedItemGetter(()=>usedItem);
    }, [showItemGuiSetter,showItemGui,isCellSelected,cellIsSelectedSetter,usedItem,usedItemSetter]);

    return null
}