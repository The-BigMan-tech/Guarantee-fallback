import { canvas,renderer } from './three-components/renderer';
import { camera, rotateCameraX, rotateCameraY} from './three-components/player/camera';
import './App.css'
import { useEffect, useRef } from 'react';
import { keysPressed } from './three-components/player/keys-pressed';

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
            if (document.pointerLockElement === container) {
                console.log('Pointer locked');
                document.addEventListener('mousemove', onPointerLockMove, false);
            } else {
                console.log('Pointer unlocked');
                document.removeEventListener('mousemove', onPointerLockMove, false);
            }
        }
        function onPointerLockMove(event: MouseEvent) {
            const rotationSpeed = 0.002;
            rotateCameraX(event.movementX * rotationSpeed);
            rotateCameraY(event.movementY * rotationSpeed);
        }
        function onClick() {
            const container = containerRef.current;
            if (!container) return;
            if (container.requestPointerLock) {
                container.requestPointerLock();
            }
        }
        function onKeyDown(event:KeyboardEvent) {
            keysPressed[event.code] = true
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
