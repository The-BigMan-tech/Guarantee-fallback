import { useSetAtom } from 'jotai/react';
import { useEffect } from 'react';
import { playerHealthSetterAtom, registerHealthSetter } from './health-state';

export function HealthSetterRegistrar() {
    const setHealth = useSetAtom(playerHealthSetterAtom);

    useEffect(() => {
        registerHealthSetter(setHealth);
    }, [setHealth]);

    return null;
}
