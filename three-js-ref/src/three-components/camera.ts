import * as THREE from 'three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);
camera.position.z = 5;
camera.rotation.order = 'YXZ';

const targetPosition = new THREE.Vector3();
const speed = 0.1;

let targetYaw = 0;   //x-axis
let targetPitch = 0; //y-axis

export const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);


export function animateCamera() {
    const maxPitch = Math.PI / 2 * 0.95;

    yawObject.position.lerp(targetPosition, speed);

    yawObject.rotation.y += (targetYaw - yawObject.rotation.y) * speed;
    pitchObject.rotation.x += (targetPitch - pitchObject.rotation.x) * speed;
    pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, pitchObject.rotation.x));// Clamp pitch to avoid flipping
}
export function moveCameraForward() {
    const forward = new THREE.Vector3(0, 0, -1); // local forward
    forward.applyQuaternion(yawObject.quaternion); // rotate to world space
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
    targetYaw -= delta
}
export function rotateCameraY(delta:number) {
    targetPitch -= delta
}
