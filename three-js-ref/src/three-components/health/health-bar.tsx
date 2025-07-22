import { useAtom } from 'jotai';
import { playerHealthAtom ,entityHealthAtom, blockDurabilityAtom} from './health-state';
import { useEffect, useRef } from 'react';
//@ts-expect-error There is no current type declaration for this package in the repo
import { Circle } from 'progressbar.js';

const CircleBarConfig = {
    duration: 0,
    strokeWidth:7,
    easing: 'easeInOut',
    color: '#189a9f', // Tailwind red-500
    trailColor: '#b8ebec', // Tailwind red-300
    trailWidth: 4,
    svgStyle: { width: '4rem', height: '4rem' },
}
export function RingHealthBar() {
    const [healthState] = useAtom(playerHealthAtom);
    const [entityHealthState] = useAtom(entityHealthAtom);
    const [blockDurability] = useAtom(blockDurabilityAtom);

    const containerRef = useRef<HTMLDivElement>(null);
    const containerRef2 = useRef<HTMLDivElement>(null);
    const containerRef3 = useRef<HTMLDivElement>(null);

    const circleRef = useRef<Circle | null>(null);
    const circleRef2 = useRef<Circle | null>(null);
    const circleRef3 = useRef<Circle | null>(null);

    // Initialize the Circle progress bar once
    useEffect(() => {
        if (containerRef.current) {
            circleRef.current = new Circle(containerRef.current, {
                ...CircleBarConfig
            });
        }
        return () => {
            circleRef.current?.destroy();
        };
    }, []);
    useEffect(() => {
        if (containerRef2.current) {
            circleRef2.current = new Circle(containerRef2.current, {
                ...CircleBarConfig,
                color: '#c00e0e', 
                trailColor: '#efaeae', 
            });
        }
        return () => {
            circleRef2.current?.destroy();
        };
    }, []);
    useEffect(() => {
        if (containerRef3.current) {
            circleRef3.current = new Circle(containerRef3.current, {
                ...CircleBarConfig,
                color: '#0e46c0', 
                trailColor: '#aebcef', 
            });
        }
        return () => {
            circleRef3.current?.destroy();
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

    useEffect(() => {
        if (!circleRef3.current || !blockDurability) return;
        const progress = blockDurability.currentValue / blockDurability.maxValue;
        circleRef3.current.set(progress); 
    }, [blockDurability]);

    return (
        <>
            <div ref={containerRef} className="fixed top-[75%] left-[47.5%] mb-[3%] w-0 h-0 z-50 pointer-events-none overflow-visible"/>
            <div ref={containerRef2} className={`fixed top-[10%] right-[10%] mb-[3%] w-0 h-0 z-50 pointer-events-none overflow-visible ${ entityHealthState ? 'opacity-100' : 'opacity-0 '}`}/>
            <div ref={containerRef3} className={`fixed top-[10%] right-[10%] mb-[3%] w-0 h-0 z-50 pointer-events-none overflow-visible ${blockDurability ? 'opacity-100' : 'opacity-0 '}`}/>
            
        </>
    );
}
