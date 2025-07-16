import { atom } from "jotai";

export const showItemGuiAtom = atom<boolean>(false);
export const isCellSelectedAtom = atom<boolean>(false);

let setShowItemGuiExternal: ((value:boolean) => void) | null = null;
let getShowItemGuiExternal: (() => boolean) | null = null;

let setIsCellSelectedExternal: ((value:boolean) => void) | null = null;
let getIsCellSelectedExternal: (() => boolean) | null = null;

export function registerShowItemGuiSetter(setter: (value:boolean) => void) {
    setShowItemGuiExternal = setter;
}
export function registerShowItemGuiGetter(getter: () => boolean) {
    getShowItemGuiExternal = getter;
}

export function registerIsCellSelectedSetter(setter: (value:boolean) => void) {
    setIsCellSelectedExternal = setter;
}
export function registerIsCellSelectedGetter(getter: () => boolean) {
    getIsCellSelectedExternal = getter;
}

export function isCellSelected() {
    if (getIsCellSelectedExternal) return getIsCellSelectedExternal();
}
export function setIsCellSelected(state:boolean) {
    if (setIsCellSelectedExternal) return setIsCellSelectedExternal(state);
}

export function toggleItemGui() {
    if (setShowItemGuiExternal && getShowItemGuiExternal) {
        setShowItemGuiExternal(!getShowItemGuiExternal());
    }
}