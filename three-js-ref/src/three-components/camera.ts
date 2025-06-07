import * as THREE from 'three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint)
camera.position.z = 5;


let targetX = camera.position.x;  
const speed = 0.1;                

export function animateCamera() {
    camera.position.x += (targetX - camera.position.x) * speed;
}
export function moveCameraLeft() {
    console.log('Moved left');
    targetX -= 1;  // Move target position left by 1 unit
}
export function moveCameraRight() {
    console.log('Moved right');
    targetX += 1;  // Move target position right by 1 unit
}