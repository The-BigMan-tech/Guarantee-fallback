import { useSetAtom } from 'jotai/react';
import { useEffect } from 'react';
import { playerHealthSetterAtom, registerHealthSetter,entityHealthSetterAtom, registerEntityHealthSetter} from './health-state';

export function HealthSetterRegistrar() {
    const setHealth = useSetAtom(playerHealthSetterAtom);
    const setEntityHealth = useSetAtom(entityHealthSetterAtom);

    useEffect(() => {
        registerHealthSetter(setHealth);
        registerEntityHealthSetter(setEntityHealth)
    }, [setHealth,setEntityHealth]);

    return null;
}
