import { canvas,renderer } from './three-components/renderer.three';
import { player } from './three-components/player/player.three';
import './App.css'
import { useEffect, useRef } from 'react';
import { Crosshair } from './crosshair';
import { RingHealthBar } from './three-components/health/health-bar';
import { HealthSetterRegistrar } from './three-components/health/health-register';
import ItemGui from './three-components/item-system/item-gui';
import { ItemSetterRegistrar } from './three-components/item-system/item-register';


function App() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        const container = containerRef.current;
        if (!container) return;
        container.appendChild(canvas);

        function resizeRendererToContainer() {
            const container = containerRef.current;
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                player.camera.cam.aspect = width / height;
                player.camera.cam.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        }
        resizeRendererToContainer();
        return () => window.removeEventListener('resize', resizeRendererToContainer);
    },[])     
    
    
    return (
        <div className='h-full w-full flex'>
            <Crosshair/>
            <RingHealthBar/>
            <HealthSetterRegistrar/>
            <ItemSetterRegistrar/>
            <ItemGui/>
            <div 
                ref={containerRef} 
                tabIndex={0}  
                className='w-full h-full z-0'>
            </div>
        </div>
    )
}
export default App
