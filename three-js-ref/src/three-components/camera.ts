import * as THREE from 'three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);
camera.position.z = 5;
camera.rotation.order = 'YXZ';

let targetX = camera.position.x;  
let targetY = camera.position.y; 
let targetZ = camera.position.z;
const speed = 0.1;

let targetYaw = 0;   //x-axis
let targetPitch = 0; //y-axis

export const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);


export function animateCamera() {
    const currentPosition = camera.position;
    const maxPitch = Math.PI / 2 * 0.95;

    currentPosition.x += (targetX - currentPosition.x) * speed;
    currentPosition.y += (targetY - currentPosition.y) * speed;
    currentPosition.z += (targetZ - currentPosition.z) * speed;
    camera.position.set(currentPosition.x,currentPosition.y,currentPosition.z)

    yawObject.rotation.y += (targetYaw - yawObject.rotation.y) * speed;
    pitchObject.rotation.x += (targetPitch - pitchObject.rotation.x) * speed;
    pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));// Clamp pitch to avoid flipping
}
export function moveCameraLeft() {
    targetX -= 1;  // Move target position left by 1 unit
}
export function moveCameraRight() {
    targetX += 1;  // Move target position right by 1 unit
}
export function moveCameraUp() {
    targetY += 1;  // Move target position left by 1 unit
}
export function moveCameraDown() {
    targetY -= 1;  // Move target position right by 1 unit
}
export function moveCameraForward() {
    targetZ -= 1;  // Move target position left by 1 unit
}
export function moveCameraBackward() {
    targetZ += 1;  // Move target position right by 1 unit
}
export function rotateCameraLeft(delta: number) {
    targetYaw -= delta
}
export function rotateCameraUp(delta:number) {
    targetPitch -= delta
}
