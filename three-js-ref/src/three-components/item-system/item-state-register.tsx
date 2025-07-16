import { useAtom } from "jotai";
import { registerShowItemGuiGetter, registerShowItemGuiSetter, showItemGuiAtom } from "./item-state";
import { useEffect } from "react";

export default function ItemStateRegister() {
    const [showItemGui,showItemGuiSetter] = useAtom(showItemGuiAtom);

    useEffect(() => {
        registerShowItemGuiSetter(showItemGuiSetter);
        registerShowItemGuiGetter(()=>showItemGui)
    }, [showItemGuiSetter,showItemGui]);

    return null
}