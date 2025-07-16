import { useSetAtom } from 'jotai/react';
import { useEffect } from 'react';
import { atom } from 'jotai';
import { registerShowItemGuiSetter,showItemGuiAtom} from './item-state';

export function ItemSetterRegistrar() {
    const showItemGuiSetterAtom = useSetAtom(
        atom(null,(_, set,state:boolean) => set(showItemGuiAtom,state))
    );
    useEffect(() => {
        registerShowItemGuiSetter(showItemGuiSetterAtom);
    }, [showItemGuiSetterAtom]);

    return null;
}
