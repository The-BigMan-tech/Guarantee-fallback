import * as THREE from 'three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);
camera.position.z = 5;

const targetPosition = new THREE.Vector3();
const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const speed = 0.1;

export const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);

targetPosition.copy(yawObject.position);
targetRotation.copy(new THREE.Euler(pitchObject.rotation.x, yawObject.rotation.y, 0, 'YXZ'));

export function animateCamera() {
    yawObject.position.lerp(targetPosition, speed);
    const maxPitch = Math.PI / 2 * 0.95;
    yawObject.rotation.y += (targetRotation.y - yawObject.rotation.y) * speed;
    pitchObject.rotation.x += (targetRotation.x - pitchObject.rotation.x) * speed;
    pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));// Clamp pitch to avoid flipping
}
export function moveCameraForward() {
    const forward = new THREE.Vector3(0, 0, -1); // local forward
    forward.applyQuaternion(yawObject.quaternion); //make forward respect the cameras rotation as controlled by the yaw object
    targetPosition.add(forward)
}
export function moveCameraBackward() {
    const backward = new THREE.Vector3(0, 0, 1);
    backward.applyQuaternion(yawObject.quaternion);
    targetPosition.add(backward);
}
export function moveCameraLeft() {
    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(yawObject.quaternion);
    targetPosition.add(left);
}
export function moveCameraRight() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(yawObject.quaternion);
    targetPosition.add(right);
}
export function moveCameraUp() {
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(yawObject.quaternion);
    targetPosition.add(up);
}
export function moveCameraDown() {
    const down = new THREE.Vector3(0, -1, 0);
    down.applyQuaternion(yawObject.quaternion);
    targetPosition.add(down);
}
export function rotateCameraX(delta: number) {
    targetRotation.y -= delta; // yaw (rotation around Y axis)
}
export function rotateCameraY(delta:number) {
    targetRotation.x -= delta;// pitch (rotation around X axis)
}
