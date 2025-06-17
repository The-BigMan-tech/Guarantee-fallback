import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { cameraMode, keysPressed, toggleThirdPerson } from "./globals";
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
const clock = new THREE.Clock();


export const player = new THREE.Group();
let playerPosition:RAPIER.Vector3 = new RAPIER.Vector3(0,1,0);

const playerCollider = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5)
const playerBody = RAPIER.RigidBodyDesc.dynamic();
const playerRigidBody = physicsWorld.createRigidBody(playerBody)
physicsWorld.createCollider(playerCollider,playerRigidBody);

playerRigidBody.setTranslation(playerPosition,true)

const loader:GLTFLoader = new GLTFLoader();
const modelPath:string = './silvermoon.glb';

const impulse:THREE.Vector3 = new THREE.Vector3(0,0,0);
const impulseDelta = 0.3;

const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new THREE.Quaternion();
const rotationDelta = 0.05;
const rotationSpeed = 0.5

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
    const forward = new THREE.Vector3(0,0,-impulseDelta);//direction vector
    forward.applyQuaternion(playerRigidBody.rotation());//setting the direction to the rigid body's world space
    impulse.set(forward.x,forward.y,forward.z)
}
function movePlayerBackward(impulseDelta:number) {
    const backward = new THREE.Vector3(0,0,impulseDelta);
    backward.applyQuaternion(playerRigidBody.rotation());
    impulse.set(backward.x,backward.y,backward.z)
}
function movePlayerLeft(impulseDelta:number) {
    const left = new THREE.Vector3(-impulseDelta,0,0);
    left.applyQuaternion(playerRigidBody.rotation());
    impulse.set(left.x,left.y,left.z)
}
function movePlayerRight(impulseDelta:number) {
    const right = new THREE.Vector3(impulseDelta,0,0);
    right.applyQuaternion(playerRigidBody.rotation());
    impulse.set(right.x,right.y,right.z)
}
function movePlayerUp(impulseDelta:number) {
    const up = new THREE.Vector3(0,impulseDelta,0);
    up.applyQuaternion(playerRigidBody.rotation());
    impulse.set(up.x,up.y,up.z)
}
function movePlayerDown(impulseDelta:number) {
    const down = new THREE.Vector3(0,-impulseDelta,0);
    down.applyQuaternion(playerRigidBody.rotation());
    impulse.set(down.x,down.y,down.z)
}
export function rotatePlayerX(rotationDelta: number) {
    targetRotation.y -= rotationDelta; 
    targetQuaternion.setFromEuler(targetRotation);
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
}
export function animatePlayer() {
    renderPlayerKeys(); 

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    const targetZ = cameraMode.isThirdPerson ? 6 : 0;
    pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 

    player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
    player.quaternion.slerp(targetQuaternion, rotationSpeed);
    playerRigidBody.setRotation(targetQuaternion,true);
}