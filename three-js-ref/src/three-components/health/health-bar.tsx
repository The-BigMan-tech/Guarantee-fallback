import { useAtom } from 'jotai';
import { playerHealthAtom ,entityHealthAtom} from './health-state';
import { useEffect, useRef } from 'react';
//@ts-expect-error There is no current type declaration for this package in the repo
import { Circle } from 'progressbar.js';

export function RingHealthBar() {
    const [healthState] = useAtom(playerHealthAtom);
    const [entityHealthState] = useAtom(entityHealthAtom);

    const containerRef = useRef<HTMLDivElement>(null);
    const containerRef2 = useRef<HTMLDivElement>(null);

    const circleRef = useRef<Circle | null>(null);
    const circleRef2 = useRef<Circle | null>(null);

    // Initialize the Circle progress bar once
    useEffect(() => {
        if (containerRef.current) {
            circleRef.current = new Circle(containerRef.current, {
                duration: 0,
                strokeWidth:7,
                easing: 'easeInOut',
                color: '#189a9f', // Tailwind red-500
                trailColor: '#b8ebec', // Tailwind red-300
                trailWidth: 4,
                svgStyle: { width: '4rem', height: '4rem' },
            });
        }
        return () => {
            circleRef.current?.destroy();
        };
    }, []);
    useEffect(() => {
        if (containerRef2.current) {
            circleRef2.current = new Circle(containerRef2.current, {
                duration: 0,
                strokeWidth:7,
                easing: 'easeInOut',
                color: '#189a9f', // Tailwind red-500
                trailColor: '#b8ebec', // Tailwind red-300
                trailWidth: 4,
                svgStyle: { width: '4rem', height: '4rem' },
            });
        }
        return () => {
            circleRef2.current?.destroy();
        };
    }, []);

  // Animate progress and update text when health changes
    useEffect(() => {
        if (!circleRef.current || !healthState) return;
        const progress = healthState.currentValue / healthState.maxValue;
        circleRef.current.set(progress); 
    }, [healthState]);

    useEffect(() => {
        if (!circleRef2.current || !entityHealthState) return;
        const progress = entityHealthState.currentValue / entityHealthState.maxValue;
        circleRef2.current.set(progress); 
    }, [entityHealthState]);

    return (
        <>
            <div ref={containerRef} className="fixed top-[75%] left-[47.5%] mb-4 w-0 h-0 z-50 pointer-events-none overflow-visible"/>
            <div ref={containerRef2} className={`fixed top-[10%] left-[10%] mb-4 w-0 h-0 z-50 pointer-events-none overflow-visible ${ entityHealthState ? 'opacity-100' : 'opacity-0 '}`}/>
        </>
    );
}
