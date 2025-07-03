import { useAtom } from 'jotai';
import { playerHealthAtom } from './health-state';
import { useEffect, useRef } from 'react';
//@ts-expect-error There is no current type declaration for this package in the repo
import { Circle } from 'progressbar.js';

export function RingHealthBar() {
    const [healthState] = useAtom(playerHealthAtom);
    const containerRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<Circle | null>(null);

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
                text: {
                    value: '', // empty string removes text
                    style: {
                        
                    },
                }
            });
        }
        return () => {
            circleRef.current?.destroy();
        };
    }, []);

  // Animate progress and update text when health changes
    useEffect(() => {
        if (!circleRef.current || !healthState) return;
        const progress = healthState.currentValue / healthState.maxValue;
        circleRef.current.set(progress); // Animate progress (0 to 1)
        circleRef.current.setText(`${healthState.currentValue} / ${healthState.maxValue}`);
    }, [healthState]);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4 w-0 h-0 z-50 pointer-events-none overflow-visible"
        />
    );
}
