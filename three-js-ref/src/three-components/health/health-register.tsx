import { useSetAtom } from 'jotai/react';
import { useEffect } from 'react';
import { playerHealthSetterAtom, registerHealthSetter,entityHealthSetterAtom, registerEntityHealthSetter} from './health-state';

export function HealthSetterRegistrar() {
    const healthSetAtom = useSetAtom(playerHealthSetterAtom);
    const entityHealthSetAtom = useSetAtom(entityHealthSetterAtom);

    useEffect(() => {
        registerHealthSetter(healthSetAtom);
        registerEntityHealthSetter(entityHealthSetAtom)
    }, [healthSetAtom,entityHealthSetAtom]);

    return null;
}
