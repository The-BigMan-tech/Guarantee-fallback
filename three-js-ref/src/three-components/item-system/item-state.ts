import { atom } from "jotai";

export const showItemGuiAtom = atom<boolean>(false);
export const isCellSelectedAtom = atom<boolean>(false);
export const refreshGuiAtom = atom<boolean>(false);

let setShowItemGuiExternal: ((value:boolean) => void) | null = null;
let getShowItemGuiExternal: (() => boolean) | null = null;

let setIsCellSelectedExternal: ((value:boolean) => void) | null = null;
let getIsCellSelectedExternal: (() => boolean) | null = null;

let setRefreshGuiExternal: ((value:boolean) => void) | null = null;
let getRefreshGuiExternal: (() => boolean) | null = null;


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

export function registerRefreshGuiSetter(setter: (value:boolean) => void) {
    setRefreshGuiExternal = setter;
}
export function registerRefreshGuiGetter(getter: () => boolean) {
    getRefreshGuiExternal = getter;
}

export function isCellSelected() {
    if (getIsCellSelectedExternal) return getIsCellSelectedExternal();
}
export function setIsCellSelected(state:boolean) {
    if (setIsCellSelectedExternal) return setIsCellSelectedExternal(state);
}

export function shouldRefreshGui() {
    if (getRefreshGuiExternal) return getRefreshGuiExternal();
}
export function reloadGui() {
    if (setRefreshGuiExternal) return setRefreshGuiExternal(true);
}

export function toggleItemGui() {
    if (setShowItemGuiExternal && getShowItemGuiExternal) {
        setShowItemGuiExternal(!getShowItemGuiExternal());
    }
}