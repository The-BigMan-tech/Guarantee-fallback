import { atom } from "jotai";

export const showItemGuiAtom = atom<boolean>(false);
export const isCellSelectedAtom = atom<boolean>(false);
export const usedItemAtom = atom<boolean>(false);

let setShowItemGuiExternal: ((value:boolean) => void) | null = null;
let getShowItemGuiExternal: (() => boolean) | null = null;

let setIsCellSelectedExternal: ((value:boolean) => void) | null = null;
let getIsCellSelectedExternal: (() => boolean) | null = null;

let setUsedItemExternal: ((value:boolean) => void) | null = null;
let getUsedItemExternal: (() => boolean) | null = null;


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

export function registerUsedItemSetter(setter: (value:boolean) => void) {
    setUsedItemExternal = setter;
}
export function registerUsedItemGetter(getter: () => boolean) {
    getUsedItemExternal = getter;
}

export function isCellSelected() {
    if (getIsCellSelectedExternal) return getIsCellSelectedExternal();
}
export function setIsCellSelected(state:boolean) {
    if (setIsCellSelectedExternal) return setIsCellSelectedExternal(state);
}

export function usedItem() {
    if (getUsedItemExternal) return getUsedItemExternal();
}
export function setUsedItem(state:boolean) {
    if (setUsedItemExternal) return setUsedItemExternal(state);
}

export function toggleItemGui() {
    if (setShowItemGuiExternal && getShowItemGuiExternal) {
        setShowItemGuiExternal(!getShowItemGuiExternal());
    }
}