import { canvas,renderer } from './three-components/renderer.three';
import { player } from './three-components/player/player.three';
import './App.css'
import { useEffect, useRef } from 'react';


function App() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        const container = containerRef.current;
        if (!container) return;
        container.appendChild(canvas);

        function resizeRendererToContainer(container: HTMLElement) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            player.camera.cam.aspect = width / height;
            player.camera.cam.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        resizeRendererToContainer(container);
    },[])     
    
    
    return (
        <div className='h-full w-full flex'>
            <div 
                ref={containerRef} 
                tabIndex={0}  
                className='w-full h-full z-0'>
            </div>
        </div>
    )
}
export default App
