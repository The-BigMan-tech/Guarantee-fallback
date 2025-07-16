import { useAtom } from 'jotai/react';
import { useEffect } from 'react';
import { registerHealthSetter,registerEntityHealthSetter, playerHealthAtom, entityHealthAtom} from './health-state';

export default function HealthStateRegistrar() {
    const [,playerHealthSetter] = useAtom(playerHealthAtom)
    const [,entityHealthSetter] = useAtom(entityHealthAtom);

    useEffect(() => {
        registerHealthSetter(playerHealthSetter);
        registerEntityHealthSetter(entityHealthSetter)
    }, [playerHealthSetter,entityHealthSetter]);

    return null;
}
