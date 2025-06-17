import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { cameraMode, keysPressed,rotationDelta ,rotationSpeed} from "./globals";
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "../physics-world";

let mixer: THREE.AnimationMixer;
let currentAction: THREE.AnimationAction | null = null;
let idleAction: THREE.AnimationAction | null = null;
let walkAction: THREE.AnimationAction | null = null;
let lookUpAction:THREE.AnimationAction | null = null;
let lookDownAction:THREE.AnimationAction | null = null;
let lookLeftAction:THREE.AnimationAction | null = null;
let lookRightAction:THREE.AnimationAction | null = null;


export const player = new THREE.Group();
let playerPosition:RAPIER.Vector = new RAPIER.Vector3(0,1,0)

const playerCollider = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5)
const playerBody = RAPIER.RigidBodyDesc.dynamic();
export const playerRigidBody = physicsWorld.createRigidBody(playerBody)
physicsWorld.createCollider(playerCollider,playerRigidBody)
playerRigidBody.setTranslation(playerPosition,true)


const loader:GLTFLoader = new GLTFLoader();
const modelPath:string = './silvermoon.glb';

const impulse = new RAPIER.Vector3(0,0,0);
const impulseDelta = 0.1;
const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new THREE.Quaternion();

loader.load(modelPath,
    gltf=>{
        const playerModel = gltf.scene
        playerModel.position.z = 0.3
        player.add(playerModel);
        pitchObject.position.y = 4
        player.add(pitchObject)
        mixer = new AnimationMixer(playerModel);
        loadPlayerAnimations(gltf)
    },undefined, 
    error =>console.error( error ),
);
function loadPlayerAnimations(gltf:GLTF) {
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
    const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
    const lookUpClip = THREE.AnimationClip.findByName(gltf.animations, 'look-up'); 
    const lookDownClip = THREE.AnimationClip.findByName(gltf.animations, 'look-down'); 
    const lookLeftClip = THREE.AnimationClip.findByName(gltf.animations, 'look-left'); 
    const lookRightClip = THREE.AnimationClip.findByName(gltf.animations, 'look-right'); 

    if (walkClip) walkAction = mixer.clipAction(walkClip);
    if (lookUpClip) lookUpAction = mixer.clipAction(lookUpClip);
    if (lookDownClip) lookDownAction = mixer.clipAction(lookDownClip);
    if (lookLeftClip) lookLeftAction = mixer.clipAction(lookLeftClip);
    if (lookRightClip) lookRightAction = mixer.clipAction(lookRightClip);
    
    if (idleClip) {
        idleAction = mixer.clipAction(idleClip);
        idleAction.play();
        currentAction = idleAction;
    }
}
function fadeToAnimation(newAction: THREE.AnimationAction) {
    if (newAction !== currentAction) {
        newAction.reset();
        newAction.play();
        if (currentAction) currentAction.crossFadeTo(newAction, 0.3, false);
        currentAction = newAction;
    }
}
export function movePlayerForward(displacement:number) {
    force.z -= displacement
}
export function movePlayerBackward(displacement:number) {
    force.z += displacement
}
export function movePlayerLeft(displacement:number) {
    force.x -= displacement
}
export function movePlayerRight(displacement:number) {
    force.x += displacement
}
export function movePlayerUp(displacement:number) {
    force.y += displacement
}
export function movePlayerDown(displacement:number) {
    force.y -= displacement
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
    force = {x:0,y:0,z:0};
    if (keysPressed['ArrowLeft']) rotatePlayerX(-rotationDelta);  
    if (keysPressed['ArrowRight']) rotatePlayerX(+rotationDelta);
    if (keysPressed['KeyW']) movePlayerBackward(displacement);
    if (keysPressed['KeyS']) movePlayerBackward(displacement);
    if (keysPressed['KeyA']) movePlayerLeft(displacement);
    if (keysPressed['KeyD']) movePlayerRight(displacement);
    if (keysPressed['KeyE']) movePlayerUp(displacement);
    if (keysPressed['KeyQ']) movePlayerDown(displacement);
    if (mixer && idleAction && walkAction && lookUpAction && lookDownAction && lookLeftAction && lookRightAction) {
        if (keysPressed['KeyW']) {
            fadeToAction(walkAction);
        }else if (keysPressed['KeyA']) {
            fadeToAction(lookLeftAction);
        }else if (keysPressed['KeyD']) {
            fadeToAction(lookRightAction);
        }else if (keysPressed['KeyQ']) {
            fadeToAction(lookDownAction);
        }else if (keysPressed['KeyE']) {
            fadeToAction(lookUpAction);
        }else {
            fadeToAction(idleAction);
        }
    }
    playerRigidBody.applyImpulse(force,true)
}
const clock = new THREE.Clock();
export function animatePlayer() {
    renderPlayerKeys(); 

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    const targetZ = cameraMode.isThirdPerson ? 6 : 0;
    pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 

    player.quaternion.slerp(targetQuaternion, rotationSpeed);

    playerPosition = playerRigidBody.translation();
    player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
}