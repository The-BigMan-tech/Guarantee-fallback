import { useAtom } from 'jotai/react';
import { useEffect } from 'react';
import { registerHealthSetter,registerEntityHealthSetter, playerHealthAtom, entityHealthAtom, blockDurabilityAtom, registerBlockDurabilitySetter} from './health-state';

export default function HealthStateRegistrar() {
    const [,playerHealthSetter] = useAtom(playerHealthAtom)
    const [,entityHealthSetter] = useAtom(entityHealthAtom);
    const [,blockDurabilitySetter] = useAtom(blockDurabilityAtom);

    useEffect(() => {
        registerHealthSetter(playerHealthSetter);
        registerEntityHealthSetter(entityHealthSetter);
        registerBlockDurabilitySetter(blockDurabilitySetter)
    }, [playerHealthSetter,entityHealthSetter,blockDurabilitySetter]);

    return null;
}
