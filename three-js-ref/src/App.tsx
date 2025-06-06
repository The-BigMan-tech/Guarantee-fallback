import { canvas,renderer } from './three-components/renderer';
import { camera } from './three-components/camera';
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
        resizeRendererToContainer(container)
    },[])

    return (
        <>
            <div ref={containerRef} className='w-full h-full'></div>
        </>
    )
}
export default App
