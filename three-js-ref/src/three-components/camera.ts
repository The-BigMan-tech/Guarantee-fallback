import * as THREE from 'three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);

const targetPosition = new THREE.Vector3();
const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const displacement = 0.5
const speed = 0.5;

export const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();

const keysPressed:Record<string,boolean> = {};
const rotationSpeed = 0.05;

camera.position.z = 5;
yawObject.add(pitchObject);
pitchObject.add(camera);

targetPosition.copy(yawObject.position);
targetRotation.copy(new THREE.Euler(pitchObject.rotation.x, yawObject.rotation.y, 0, 'YXZ'));

window.addEventListener('keydown', (e) => keysPressed[e.code] = true);
window.addEventListener('keyup', (e) => {keysPressed[e.code] = false; });

export function moveCameraForward(displacement:number) {
    const forward = new THREE.Vector3(0, 0,-displacement); // local forward
    forward.applyQuaternion(yawObject.quaternion); //make forward respect the cameras rotation as controlled by the yaw object
    targetPosition.add(forward)
}
export function moveCameraBackward(displacement:number) {
    const backward = new THREE.Vector3(0, 0,displacement);
    backward.applyQuaternion(yawObject.quaternion);
    targetPosition.add(backward);
}
export function moveCameraLeft(displacement:number) {
    const left = new THREE.Vector3(-displacement, 0, 0);
    left.applyQuaternion(yawObject.quaternion);
    targetPosition.add(left);
}
export function moveCameraRight(displacement:number) {
    const right = new THREE.Vector3(displacement, 0, 0);
    right.applyQuaternion(yawObject.quaternion);
    targetPosition.add(right);
}
export function moveCameraUp(displacement:number) {
    const up = new THREE.Vector3(0, displacement, 0);
    up.applyQuaternion(yawObject.quaternion);
    targetPosition.add(up);
}
export function moveCameraDown(displacement:number) {
    const down = new THREE.Vector3(0, -displacement, 0);
    down.applyQuaternion(yawObject.quaternion);
    targetPosition.add(down);
}
export function rotateCameraX(delta: number) {
    targetRotation.y -= delta; // yaw (rotation around Y axis)
}
export function rotateCameraY(delta:number) {
    targetRotation.x -= delta;// pitch (rotation around X axis)
}

export function renderKeyEvents() {
    if (keysPressed['ArrowLeft']) rotateCameraX(-rotationSpeed);  
    if (keysPressed['ArrowRight']) rotateCameraX(+rotationSpeed);
    if (keysPressed['ArrowUp']) rotateCameraY(-rotationSpeed);  
    if (keysPressed['ArrowDown']) rotateCameraY(+rotationSpeed);
    if (keysPressed['KeyW']) moveCameraForward(displacement);
    if (keysPressed['KeyS']) moveCameraBackward(displacement);
    if (keysPressed['KeyA']) moveCameraLeft(displacement);
    if (keysPressed['KeyD']) moveCameraRight(displacement);
    if (keysPressed['KeyE']) moveCameraUp(displacement);
    if (keysPressed['KeyQ']) moveCameraDown(displacement);
}
export function animateCamera() {
    yawObject.position.lerp(targetPosition, speed);
    const maxPitch = Math.PI / 2 * 0.95;
    yawObject.rotation.y += (targetRotation.y - yawObject.rotation.y) * speed;
    pitchObject.rotation.x += (targetRotation.x - pitchObject.rotation.x) * speed;
    pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));// Clamp pitch to avoid flipping
}

