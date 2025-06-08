import { canvas,renderer } from './three-components/renderer';
import { camera} from './three-components/camera';
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
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        resizeRendererToContainer(container);
    },[])     

    return (
        <div className='h-full w-full flex'>
            <div ref={containerRef} 
                tabIndex={0} 
                className='w-full h-full z-0'>
            </div>
            <h1 className='z-10 text-white absolute left-[50%]'>Hello</h1>
        </div>
    )
}
export default App
