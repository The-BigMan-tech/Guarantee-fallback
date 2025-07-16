import { atom } from 'jotai';

export const showItemGuiAtom = atom<boolean>(true);

let setShowItemGuiExternal: ((value:boolean) => void) | null = null;
export function registerShowItemGuiSetter(setter: (value:boolean) => void) {
    setShowItemGuiExternal = setter;
}
export function setShowItemGui(value:boolean) {
    if (setShowItemGuiExternal) setShowItemGuiExternal(value);
}