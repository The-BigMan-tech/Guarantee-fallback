import { canvas,renderer } from './three-components/renderer.three';
import { camera} from './three-components/player/camera.three';
import { player2 } from './three-components/player/control-class.three';
import './App.css'
import { useEffect, useRef } from 'react';
import { keysPressed } from './three-components/player/globals.three';

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
        function onPointerLockChange() {
            // if (document.pointerLockElement === container) {
            //     console.log('Pointer locked');
            //     document.addEventListener('mousemove',player2.onPointerLockMove(), false);
            // } else {
            //     console.log('Pointer unlocked');
            //     document.removeEventListener('mousemove',player2.onPointerLockMove(), false);
            // }
        }
        function onClick() {
            const container = containerRef.current;
            if (!container) return;
            if (container.requestPointerLock) {
                container.requestPointerLock();
            }
        }
        function onKeyDown(event:KeyboardEvent) {
            keysPressed[event.code] = true;
            console.log("KEY BIND: ",event.code)
            if (event.code == 'KeyP') {
                console.log("Terminated logs");
                console.log = ()=>{};
            }
        }
        function onKeyUp(event:KeyboardEvent) {
            keysPressed[event.code] = false
        }
        resizeRendererToContainer(container);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('click',onClick);
        document.addEventListener('pointerlockchange', onPointerLockChange);
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
