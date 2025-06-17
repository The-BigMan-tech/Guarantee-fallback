import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { cameraMode, keysPressed,rotationDelta } from "./globals";
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
let playerPosition:RAPIER.Vector3 = new RAPIER.Vector3(0,1,0);
let playerRotation:RAPIER.Rotation;

const playerCollider = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5)
const playerBody = RAPIER.RigidBodyDesc.dynamic();
const playerRigidBody = physicsWorld.createRigidBody(playerBody)
physicsWorld.createCollider(playerCollider,playerRigidBody)
playerRigidBody.setTranslation(playerPosition,true);
playerRotation = playerRigidBody.rotation()


const loader:GLTFLoader = new GLTFLoader();
const modelPath:string = './silvermoon.glb';

const impulse:THREE.Vector3 = new THREE.Vector3(0,0,0);
const impulseDelta = 0.3;


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
function movePlayerForward(impulseDelta:number) {
    impulse.z -= impulseDelta
}
function movePlayerBackward(impulseDelta:number) {
    impulse.z += impulseDelta
}
function movePlayerLeft(impulseDelta:number) {
    impulse.x -= impulseDelta
}
function movePlayerRight(impulseDelta:number) {
    impulse.x += impulseDelta
}
function movePlayerUp(impulseDelta:number) {
    impulse.y += impulseDelta
}
function movePlayerDown(impulseDelta:number) {
    impulse.y -= impulseDelta
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
    impulse.set(0,0,0);

    toggleThirdPerson();
    if (keysPressed['KeyW']) movePlayerForward(impulseDelta);
    if (keysPressed['KeyS']) movePlayerBackward(impulseDelta);
    if (keysPressed['KeyA']) movePlayerLeft(impulseDelta);
    if (keysPressed['KeyD']) movePlayerRight(impulseDelta);
    if (keysPressed['KeyE']) movePlayerUp(impulseDelta);
    if (keysPressed['KeyQ']) movePlayerDown(impulseDelta);
    if (keysPressed['ArrowLeft']) rotatePlayerX(-rotationDelta);  
    if (keysPressed['ArrowRight']) rotatePlayerX(+rotationDelta);

    if (mixer && idleAction && walkAction && lookUpAction && lookDownAction && lookLeftAction && lookRightAction) {
        if (keysPressed['KeyW']) {
            fadeToAnimation(walkAction);
        }else if (keysPressed['KeyA']) {
            fadeToAnimation(lookLeftAction);
        }else if (keysPressed['KeyD']) {
            fadeToAnimation(lookRightAction);
        }else if (keysPressed['KeyQ']) {
            fadeToAnimation(lookDownAction);
        }else if (keysPressed['KeyE']) {
            fadeToAnimation(lookUpAction);
        }else {
            fadeToAnimation(idleAction);
        }
    }
    playerRigidBody.applyImpulse(impulse,true);
    playerPosition = playerRigidBody.translation();
    playerRotation = playerRigidBody.rotation();
}
const clock = new THREE.Clock();
export function animatePlayer() {
    renderPlayerKeys(); 

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    const targetZ = cameraMode.isThirdPerson ? 6 : 0;
    pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 

    player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
    player.rotation.set(playerRotation.x,playerRotation.y,playerRotation.z)
}