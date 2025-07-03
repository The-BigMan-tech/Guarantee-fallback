import { useAtom } from 'jotai';
import { playerHealthAtom } from './health-state';

export function HealthBar() {
    const [healthState] = useAtom(playerHealthAtom);

    return (
        <progress className="pointer-events-none box-border fixed bottom-[20%] left-[50%] z-[1000]" value={healthState?.currentValue} max={healthState?.maxValue} />
    );
}
