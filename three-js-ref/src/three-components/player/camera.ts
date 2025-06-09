import * as THREE from 'three';
import { keysPressed,rotationDelta,rotationSpeed } from './globals';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);

const targetQuaternion = new THREE.Quaternion();
export const pitchObject = new THREE.Object3D();

pitchObject.add(camera);
targetQuaternion.copy(pitchObject.quaternion);

export function rotateCameraY(delta:number) {
    const pitchChange = new THREE.Quaternion();
    pitchChange.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -delta);
    targetQuaternion.multiplyQuaternions(pitchChange, targetQuaternion);
    clampPitch()
}
function clampPitch() {
    const maxPitch = Math.PI / 2 * 0.95;
    const euler = new THREE.Euler().setFromQuaternion(targetQuaternion, 'YXZ');
    euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));
    targetQuaternion.setFromEuler(euler);
}
function renderCameraKeys() {
    if (keysPressed['ArrowUp']) rotateCameraY(-rotationDelta);  
    if (keysPressed['ArrowDown']) rotateCameraY(+rotationDelta);
}
export function animateCamera() {
    renderCameraKeys()
    pitchObject.quaternion.slerp(targetQuaternion, rotationSpeed);
}

