import { atom } from "jotai";

export const showItemGuiAtom = atom<boolean>(false);

let setShowItemGuiExternal: ((value:boolean) => void) | null = null;
let getShowItemGuiExternal: (() => boolean) | null = null;

export function registerShowItemGuiSetter(setter: (value:boolean) => void) {
    setShowItemGuiExternal = setter;
}
export function registerShowItemGuiGetter(getter: () => boolean) {
    getShowItemGuiExternal = getter;
}

export function toggleItemGui() {
    if (setShowItemGuiExternal && getShowItemGuiExternal) {
        setShowItemGuiExternal(!getShowItemGuiExternal());
    }
}