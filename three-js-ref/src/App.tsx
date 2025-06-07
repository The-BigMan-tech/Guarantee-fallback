import { canvas,renderer } from './three-components/renderer';
import { camera,moveCameraBackward,moveCameraDown,moveCameraForward,moveCameraLeft,moveCameraRight, moveCameraUp,rotateCameraLeft,rotateCameraUp} from './three-components/camera';
import './App.css'
import { useEffect, useRef, type KeyboardEvent } from 'react';

function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });

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
        
        window.addEventListener('resize',() => {
            resizeRendererToContainer(container);
        });
    },[])
    function onMouseDown(event: React.MouseEvent) {
        isDragging.current = true;
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
    }
    function onMouseMove(event: React.MouseEvent) {
        if (!isDragging.current) return;
        const deltaX = event.clientX - previousMousePosition.current.x;
        const deltaY = event.clientY - previousMousePosition.current.y;
        const rotationSpeed = 0.005; // Adjust sensitivity as needed
        rotateCameraLeft(deltaX * rotationSpeed); // Update your camera target rotations
        rotateCameraUp(deltaY * rotationSpeed);
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
    }
    function onMouseUp() {
        isDragging.current = false;
    }
    function moveCamera(event:KeyboardEvent<HTMLDivElement>) {
        switch (event.code) {
            case 'KeyA':
                console.log("Called Left");
                moveCameraLeft();
                break;
            case 'KeyD':
                console.log("Called Right");
                moveCameraRight();
                break;
            case 'KeyW':
                console.log("Called forward");
                moveCameraForward();
                break;
            case 'KeyS':
                console.log("Called backward");
                moveCameraBackward();
                break;
            case 'Space':
                console.log("Called Up");
                moveCameraUp();
                break;
            case 'ShiftLeft':
                console.log("Called Down");
                moveCameraDown();
                break;
        }
    }

    return (
        <div className='h-full w-full flex'>
            <div ref={containerRef} 
                onKeyDown={moveCamera} 
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}  
                tabIndex={0} 
                className='w-full h-full z-0'>
            </div>
            <h1 className='z-10 text-white absolute left-[50%]'>Hello</h1>
        </div>
    )
}
export default App
