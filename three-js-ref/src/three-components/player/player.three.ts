import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera";
import { walkSound } from "./sounds";
import { cameraMode, keysPressed, toggleThirdPerson } from "./globals";
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "../physics-world";


const loader:GLTFLoader = new GLTFLoader();
const modelPath:string = './silvermoon.glb';

let mixer: THREE.AnimationMixer;
let currentAction: THREE.AnimationAction | null = null;
let idleAction: THREE.AnimationAction | null = null;
let walkAction: THREE.AnimationAction | null = null;
let lookUpAction:THREE.AnimationAction | null = null;
let lookDownAction:THREE.AnimationAction | null = null;
let lookLeftAction:THREE.AnimationAction | null = null;
let lookRightAction:THREE.AnimationAction | null = null;
let jumpAction:THREE.AnimationAction | null = null;
const clock = new THREE.Clock();


export const player = new THREE.Group();//dont directly control the player position.do it through the rigid body
let playerPosition:RAPIER.Vector3 = new RAPIER.Vector3(0,1,0);

const playerCollider = RAPIER.ColliderDesc.capsule(0.5, 1);
const playerBody = RAPIER.RigidBodyDesc.dynamic();
playerBody.mass = 40

const playerRigidBody = physicsWorld.createRigidBody(playerBody)
physicsWorld.createCollider(playerCollider,playerRigidBody);
playerRigidBody.setTranslation(playerPosition,true);

const velocity:THREE.Vector3 = new THREE.Vector3(0,1,0);
const velocityDelta = 25;

const impulse:THREE.Vector3 = new THREE.Vector3(0,0,0);
const impulseDelta = 80;
const jumpImpulse = 30;

const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new THREE.Quaternion();
const rotationDelta = 0.05;
const rotationSpeed = 0.4;

const maxHeightDiffFromGround = 0.4
let shouldPlayJumpAnimation = false;
let groundLevel:number = 1;//initial ground level of the terrain

const maxHeight = 4//*tune here
let shouldStepUp = false;

const stableFrameCount = 15;
const positionThreshold = 0.02;  // Adjust based on your precision needs
const lastYPositions: number[] = [];


loader.load(modelPath,
    gltf=>{
        const playerModel = gltf.scene
        playerModel.position.z = 0.3
        player.add(playerModel);
        pitchObject.position.y = 4
        player.add(pitchObject)
        mixer = new AnimationMixer(playerModel);
        loadPlayerAnimations(gltf);
        applyMaterialToModel(playerModel);
    },undefined, 
    error =>console.error( error ),
);
function applyMaterialToModel(playerModel:THREE.Group<THREE.Object3DEventMap>) {
    playerModel.traverse((obj) => {//apply a metallic material
        if (!(obj instanceof THREE.Mesh)) return
        if (obj.material && obj.material.isMeshStandardMaterial) {
            obj.material.metalness = 0.5;   // Fully metallic
            obj.material.roughness = 0.6;   // Low roughness for shiny metal
            obj.material.needsUpdate = true;
        }else {
            obj.material = new THREE.MeshStandardMaterial({
                color: obj.material.color || 0xffffff,
                metalness: 0.8,
                roughness: 0.6
            });
        }
    });
}
function loadPlayerAnimations(gltf:GLTF) {
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
    const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
    const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
    const lookUpClip = THREE.AnimationClip.findByName(gltf.animations, 'look-up'); 
    const lookDownClip = THREE.AnimationClip.findByName(gltf.animations, 'look-down'); 
    const lookLeftClip = THREE.AnimationClip.findByName(gltf.animations, 'look-left'); 
    const lookRightClip = THREE.AnimationClip.findByName(gltf.animations, 'look-right'); 

    if (walkClip) walkAction = mixer.clipAction(walkClip);
    if (lookUpClip) lookUpAction = mixer.clipAction(lookUpClip);
    if (jumpClip) jumpAction = mixer.clipAction(jumpClip);
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
        if (currentAction) currentAction.crossFadeTo(newAction, 0.4, false);
        currentAction = newAction;
    }
}
function mapKeysToAnimation() {
    if (mixer && idleAction && walkAction && lookUpAction && lookDownAction && lookLeftAction && lookRightAction && jumpAction) {
        if (!isGrounded() && shouldPlayJumpAnimation && !shouldStepUp) {
            walkSound.stop();
            fadeToAnimation(jumpAction);
        }else if (keysPressed['KeyW']) {
            if (!walkSound.isPlaying) walkSound.play();
            fadeToAnimation(walkAction);
        }else if (keysPressed['KeyA']) {
            if (!walkSound.isPlaying) walkSound.play();
            fadeToAnimation(lookLeftAction);
        }else if (keysPressed['KeyD']) {
            if (!walkSound.isPlaying) walkSound.play();
            fadeToAnimation(lookRightAction);
        }else if (keysPressed['KeyE']) {
            fadeToAnimation(lookUpAction);
        }else {
            walkSound.stop();
            fadeToAnimation(idleAction);
        }
    }
}
function movePlayerForward(velocityDelta:number) {
    const forward = new THREE.Vector3(0,0,-velocityDelta);//direction vector
    forward.applyQuaternion(player.quaternion);//setting the direction to the rigid body's world space
    velocity.set(forward.x,forward.y,forward.z)
}
function movePlayerBackward(velocityDelta:number) {
    const backward = new THREE.Vector3(0,0,velocityDelta);
    backward.applyQuaternion(player.quaternion);
    velocity.set(backward.x,backward.y,backward.z)
}
function movePlayerLeft(velocityDelta:number) {
    const left = new THREE.Vector3(-velocityDelta,0,0);
    left.applyQuaternion(player.quaternion);
    velocity.set(left.x,left.y,left.z)
}
function movePlayerRight(velocityDelta:number) {
    const right = new THREE.Vector3(velocityDelta,0,0);
    right.applyQuaternion(player.quaternion);
    velocity.set(right.x,right.y,right.z)
}
function movePlayerUp(impulseDelta:number) {
    const up = new THREE.Vector3(0,impulseDelta,0);
    up.applyQuaternion(player.quaternion);
    impulse.set(up.x,up.y,up.z);
}
function movePlayerDown(impulseDelta:number) {
    const down = new THREE.Vector3(0,-impulseDelta,0);
    down.applyQuaternion(player.quaternion);
    impulse.set(down.x,down.y,down.z)
}
export function rotatePlayerX(rotationDelta: number) {
    targetRotation.y -= rotationDelta; 
    targetQuaternion.setFromEuler(targetRotation);
}
function mapKeysToPlayer() {
    velocity.set(0,-10,0);//*tune.im using it for the gravity replacement that setting linear vel removes
    impulse.set(0,0,0);
    let flying = false
    toggleThirdPerson();
    if (keysPressed['ArrowLeft'])  {
        rotatePlayerX(-rotationDelta)
    };  
    if (keysPressed['ArrowRight']) {
        rotatePlayerX(+rotationDelta)
    };
    if (keysPressed['KeyQ']) {
        movePlayerDown(impulseDelta);
        flying = true;
        playerRigidBody.applyImpulse(impulse,true)
    }
    if (keysPressed['KeyE']) {
        movePlayerUp(impulseDelta)
        shouldPlayJumpAnimation = false;
        flying = true
        playerRigidBody.applyImpulse(impulse,true)
    }
    if (keysPressed['KeyW']) {
        if (shouldStepUp) {
            console.log('Attemptig to step up');
            shouldPlayJumpAnimation = false
            movePlayerForward(5);
            velocity.y +=20
        }else {
            movePlayerForward(velocityDelta);
            if (flying) playerRigidBody.applyImpulse(velocity,true);
        }
    }
    if (keysPressed['KeyS']) {
        movePlayerBackward(velocityDelta);
    }
    if (keysPressed['KeyA']) {
        movePlayerLeft(velocityDelta);
    }
    if (keysPressed['KeyD']) {
        movePlayerRight(velocityDelta);
    }
    if (keysPressed['Space'] && isGrounded()) {
        movePlayerUp(jumpImpulse)//the linvel made it sluggish so i had to increase the number
        shouldPlayJumpAnimation = true;
        velocity.y = 0
        velocity.add(impulse);
    }
    mapKeysToAnimation();
    if (isGrounded() && !flying) playerRigidBody.setLinvel(velocity,true);
    playerPosition = playerRigidBody.translation();
    shouldStepUp = false;
}
function isGrounded() {
    const playerY = Number(playerPosition.y.toFixed(1)) 
    const groundY = Number((groundLevel).toFixed(1))
    const heightDifference = Number((Math.abs(playerY - groundY)).toFixed(1))
    const onGround = heightDifference  <= maxHeightDiffFromGround//account for small precision differences

    console.log('playerY:', playerY);
    console.log('groundLevel:', groundLevel);
    console.log('groundY:', groundY);
    console.log("Height diff: ",heightDifference);
    return onGround 
}
function updateGroundLevel() {
    const currentY = playerRigidBody.translation().y;
    lastYPositions.push(currentY);
    if (lastYPositions.length > stableFrameCount) {
        lastYPositions.shift();
    }
    if (lastYPositions.length === stableFrameCount) {
        const minY = Math.min(...lastYPositions);
        const maxY = Math.max(...lastYPositions);
        if ((maxY - minY) < positionThreshold) {
            groundLevel = currentY 
        }
    }
}
function tryToStepUp() {
    const forward = new THREE.Vector3(0, 0, -1); // Local forward
    const rotation = playerRigidBody.rotation();
    const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    forward.applyQuaternion(quat).normalize();

    const stepCheckDistance = 2.5 //im using a positive offset because the forward vector already points forward.
    const point = new THREE.Vector3(
        playerPosition.x + forward.x * stepCheckDistance,
        playerPosition.y,
        playerPosition.z + forward.z * stepCheckDistance
    );

    physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
        const collider = physicsWorld.getCollider(colliderObject.handle);
        const shape = collider.shape
        console.log('Collider shape:', shape);
        
        if (shape instanceof RAPIER.Cuboid) {
            const halfExtents = shape.halfExtents;
            const height = halfExtents.y * 2;
            console.log('Obstacle height:', height);
            if (height <= maxHeight) {
                console.log("STEPPING UP");
                shouldStepUp = true
            }
        }
        return true;//*tune here
    });    
}
function updateCameraRotation() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    const targetZ = cameraMode.isThirdPerson ? 6 : 0;
    pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 
}
function updatePlayerTransformations() {
    player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
    player.quaternion.slerp(targetQuaternion, rotationSpeed);
    playerRigidBody.setRotation(targetQuaternion,true);
}
function respawnIfOutOfBounds() {
    if (playerPosition.y <= -60) {
        playerRigidBody.setTranslation({x:0,y:20,z:0},true);
        playerPosition = playerRigidBody.translation();
        player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
    }
}
export function updatePlayer() {
    updateGroundLevel();
    mapKeysToPlayer(); 
    updateCameraRotation();
    updatePlayerTransformations();
    respawnIfOutOfBounds()
    tryToStepUp();
}
