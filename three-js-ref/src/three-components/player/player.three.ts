import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { cameraMode, keysPressed,rotationDelta ,rotationSpeed} from "./globals";
import { AnimationMixer } from 'three';

let mixer: THREE.AnimationMixer;
let currentAction: THREE.AnimationAction | null = null;
let idleAction: THREE.AnimationAction | null = null;
let walkAction: THREE.AnimationAction | null = null;

export const player = new THREE.Group();
const loader = new GLTFLoader();
const modelPath:string = './godotbot-2-material.glb';

const targetPosition = new THREE.Vector3();
const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new THREE.Quaternion();
const displacement = 0.5;
const speed = 0.5;

loader.load(modelPath,
    gltf=>{
        const playerModel = gltf.scene;
        playerModel.position.z = 0.2
        player.add(playerModel);
        pitchObject.position.y = 3.5
        player.add(pitchObject)
        mixer = new AnimationMixer(playerModel);

        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'walk'); 
        
        if (idleClip) {
            idleAction = mixer.clipAction(idleClip);
            idleAction.play();
            currentAction = idleAction;
        }
        if (walkClip) {
            walkAction = mixer.clipAction(walkClip);
        }
    },undefined, 
    error =>console.error( error ),
);
targetPosition.copy(player.position);

function fadeToAction(newAction: THREE.AnimationAction) {
    if (newAction !== currentAction) {
        newAction.reset();
        newAction.play();
        if (currentAction) {
            currentAction.crossFadeTo(newAction, 0.3, false); // smooth 0.3s crossfade
        }
        currentAction = newAction;
    }
}
function isMoving() {
    return keysPressed['KeyW'] || keysPressed['KeyA'] || keysPressed['KeyS'] || keysPressed['KeyD'];
}
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
    targetQuaternion.setFromEuler(targetRotation);
}
let canToggle = true;
function toggleThirdPerson() {
    if (keysPressed['KeyT']) {
        if (canToggle) {
            cameraMode.isThirdPerson = !cameraMode.isThirdPerson;
            canToggle = false;  // prevent further toggles until key released
        }
    } else {
      canToggle = true;  // reset when key released
    }
}

function renderPlayerKeys() {
    toggleThirdPerson();
    if (keysPressed['ArrowLeft']) rotatePlayerX(-rotationDelta);  
    if (keysPressed['ArrowRight']) rotatePlayerX(+rotationDelta);
    if (keysPressed['KeyW']) movePlayerForward(displacement);
    if (keysPressed['KeyS']) movePlayerBackward(displacement);
    if (keysPressed['KeyA']) movePlayerLeft(displacement);
    if (keysPressed['KeyD']) movePlayerRight(displacement);
    if (keysPressed['KeyE']) movePlayerUp(displacement);
    if (keysPressed['KeyQ']) movePlayerDown(displacement);
    if (mixer && idleAction && walkAction) {
        if (isMoving()) {
            fadeToAction(walkAction);
        } else {
            fadeToAction(idleAction);
        }
    }
}
const clock = new THREE.Clock();
export function animatePlayer() {
    renderPlayerKeys(); 
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    const targetZ = cameraMode.isThirdPerson ? 5 : 0;
    pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 
    player.position.lerp(targetPosition, speed);
    player.quaternion.slerp(targetQuaternion, rotationSpeed);
}