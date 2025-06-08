import { canvas,renderer } from './three-components/renderer';
import { camera} from './three-components/camera';
import './App.css'
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { toggleCameraMode } from './three-components/camera-mode';

function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(()=>{
        const container = containerRef.current;
        if (!container) return;
        container.appendChild(canvas);

        function resizeRendererToContainer(container: HTMLElement) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        resizeRendererToContainer(container);
    },[])     
    function onKeyDown(event:KeyboardEvent) {
        if (event.code == "KeyT") toggleCameraMode();
    }
    return (
        <div className='h-full w-full flex'>
            <div ref={containerRef} 
                tabIndex={0} 
                onKeyDown={onKeyDown}
                className='w-full h-full z-0'>
            </div>
        </div>
    )
}
export default App
