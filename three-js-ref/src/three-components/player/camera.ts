import * as THREE from 'three';
import { keysPressed,rotationDelta,rotationSpeed } from './globals';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);

const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
export const pitchObject = new THREE.Object3D();

pitchObject.add(camera);
targetRotation.copy(new THREE.Euler(pitchObject.rotation.x,pitchObject.rotation.y, 0, 'YXZ'));

export function rotateCameraY(delta:number) {
    targetRotation.x -= delta;
}
function renderCameraKeys() {
    if (keysPressed['ArrowUp']) rotateCameraY(-rotationDelta);  
    if (keysPressed['ArrowDown']) rotateCameraY(+rotationDelta);
}
export function animateCamera() {
    renderCameraKeys()
    const maxPitch = Math.PI / 2 * 0.95;
    pitchObject.rotation.x += (targetRotation.x - pitchObject.rotation.x) * rotationSpeed;
    pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));// Clamp pitch to avoid flipping
}

