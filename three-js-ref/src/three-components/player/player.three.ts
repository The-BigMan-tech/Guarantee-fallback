import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { keysPressed,rotationDelta ,rotationSpeed} from "./globals";

export const player = new THREE.Group();
const loader = new GLTFLoader();
const modelPath:string = './godotbot-2.glb';

const targetPosition = new THREE.Vector3();
const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const displacement = 0.5;
const speed = 0.5;

loader.load(modelPath,
    gltf=>{
        const playerModel = gltf.scene;
        player.add(playerModel);
        pitchObject.position.y += 4
        pitchObject.position.z += 5;
        player.add(pitchObject)
    },undefined, 
    error =>console.error( error ),
);
targetPosition.copy(player.position);

export function movePlayerForward(displacement:number) {
    const forward = new THREE.Vector3(0, 0,-displacement); // local forward
    forward.applyQuaternion(player.quaternion); //make forward respect the cameras rotation as controlled by the yaw object
    targetPosition.add(forward)
}
export function movePlayerBackward(displacement:number) {
    const backward = new THREE.Vector3(0, 0,displacement);
    backward.applyQuaternion(player.quaternion);
    targetPosition.add(backward);
}
export function movePlayerLeft(displacement:number) {
    const left = new THREE.Vector3(-displacement, 0, 0);
    left.applyQuaternion(player.quaternion);
    targetPosition.add(left);
}
export function movePlayerRight(displacement:number) {
    const right = new THREE.Vector3(displacement, 0, 0);
    right.applyQuaternion(player.quaternion);
    targetPosition.add(right);
}
export function movePlayerUp(displacement:number) {
    const up = new THREE.Vector3(0, displacement, 0);
    up.applyQuaternion(player.quaternion);
    targetPosition.add(up);
}
export function movePlayerDown(displacement:number) {
    const down = new THREE.Vector3(0, -displacement, 0);
    down.applyQuaternion(player.quaternion);
    targetPosition.add(down);
}
export function rotatePlayerX(delta: number) {
    targetRotation.y -= delta; 
}
function renderPlayerKeys() {
    if (keysPressed['ArrowLeft']) rotatePlayerX(-rotationDelta);  
    if (keysPressed['ArrowRight']) rotatePlayerX(+rotationDelta);
    if (keysPressed['KeyW']) movePlayerForward(displacement);
    if (keysPressed['KeyS']) movePlayerBackward(displacement);
    if (keysPressed['KeyA']) movePlayerLeft(displacement);
    if (keysPressed['KeyD']) movePlayerRight(displacement);
    if (keysPressed['KeyE']) movePlayerUp(displacement);
    if (keysPressed['KeyQ']) movePlayerDown(displacement);
}
export function animatePlayer() {
    renderPlayerKeys();
    player.position.lerp(targetPosition, speed);
    player.rotation.y += (targetRotation.y - player.rotation.y) * rotationSpeed;
}