import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { pitchObject } from "./camera.three";
import { landSound, walkSound } from "./sounds.three";
import { cameraMode, gravityY, keysPressed, toggleThirdPerson } from "./globals.three";
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "../physics-world.three";
import { cube } from "../terrain.three";


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
let playerPosition:RAPIER.Vector3 = new RAPIER.Vector3(0,10,0);//so that the player spawns high enough to fall on top of a block not inbetween

const playerCollider = RAPIER.ColliderDesc.capsule(0.5, 1);
const playerBody = RAPIER.RigidBodyDesc.dynamic();
playerBody.mass = 40

const playerRigidBody = physicsWorld.createRigidBody(playerBody)
physicsWorld.createCollider(playerCollider,playerRigidBody);
playerRigidBody.setTranslation(playerPosition,true);

const velocity:THREE.Vector3 = new THREE.Vector3(0,1,0);
const velocityDelta = 30;
const jumpImpulse = 30;


const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
const targetQuaternion = new THREE.Quaternion();
const rotationDelta = 0.04;
const rotationSpeed = 0.4;


const maxStepUpHeight = 3//*tune here
const stepCheckDistance = 3; //im using a positive offset because the forward vector already points forward.
let shouldPlayJumpAnimation = false;
let obstacleHeight = 0;
let shouldStepUp = false;


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
    velocity.add(forward)
}
function movePlayerBackward(velocityDelta:number) {
    const backward = new THREE.Vector3(0,0,velocityDelta);
    backward.applyQuaternion(player.quaternion);
    velocity.add(backward)
}
function movePlayerLeft(velocityDelta:number) {
    const left = new THREE.Vector3(-velocityDelta,0,0);
    left.applyQuaternion(player.quaternion);
    velocity.add(left)
}
function movePlayerRight(velocityDelta:number) {
    const right = new THREE.Vector3(velocityDelta,0,0);
    right.applyQuaternion(player.quaternion);
    velocity.add(right)
}
function movePlayerUp(velocityDelta:number) {
    const up = new THREE.Vector3(0,velocityDelta,0);
    up.applyQuaternion(player.quaternion);
    velocity.add(up);
}
function movePlayerDown(velocityDelta:number) {
    const down = new THREE.Vector3(0,-velocityDelta,0);
    down.applyQuaternion(player.quaternion);
    velocity.add(down);
}
export function rotatePlayerX(rotationDelta: number) {
    targetRotation.y -= rotationDelta; 
    targetQuaternion.setFromEuler(targetRotation);
}


function calculateUpwardVelocity() {
    const destinationHeight = Math.round(obstacleHeight)
    const timeToReachHeight = Math.sqrt((2*destinationHeight)/gravityY);
    const upwardVelocity = Math.round((destinationHeight/timeToReachHeight) + (0.5 * gravityY * timeToReachHeight));
    return upwardVelocity
}
function calculateForwardVelocity(upwardVelocity:number) {
    const destinationHeight = Math.round(obstacleHeight)
    const timeToReachHeight = (upwardVelocity/gravityY) + Math.sqrt((2*destinationHeight)/gravityY)
    const forwardVelocity = Math.round(stepCheckDistance/timeToReachHeight)
    console.log("Final forward velocity: ",forwardVelocity);
    return forwardVelocity
}


function forcePlayerDown() {//to force the player down if he isnt stepping up and he is in the air while moving forward.the effect of this is seen when the player is stepping down
    if (!shouldStepUp && !isGrounded()) {
        movePlayerDown(gravityY)
    };
}
function moveOverObstacle() {
    console.log('Attemptig to step up');
    shouldPlayJumpAnimation = false;
    const upwardVelocity = calculateUpwardVelocity()
    const forwardVelocity = calculateForwardVelocity(upwardVelocity)
    movePlayerForward(forwardVelocity);
    movePlayerUp(upwardVelocity);
}
function mapKeysToPlayer() {
    velocity.set(0,0,0);//im resetting the velocity and impulse every frame to prevent accumulation over time

    if (keysPressed['ArrowLeft'])  {
        rotatePlayerX(-rotationDelta)
    };  
    if (keysPressed['ArrowRight']) {
        rotatePlayerX(+rotationDelta)
    };
    if (keysPressed['KeyW']) {
        if (shouldStepUp) {
            moveOverObstacle();
        }else {
            movePlayerForward(velocityDelta);
            forcePlayerDown()
        }
    }
    if (keysPressed['KeyS']) {
        movePlayerBackward(velocityDelta);
        forcePlayerDown()
    }
    if (keysPressed['KeyA']) {
        movePlayerLeft(velocityDelta);
        forcePlayerDown()
    }
    if (keysPressed['KeyD']) {
        movePlayerRight(velocityDelta);
        forcePlayerDown()
    }
    if (keysPressed['Space']) {
        movePlayerUp(jumpImpulse)//the linvel made it sluggish so i had to increase the number
        shouldPlayJumpAnimation = true;
    }
    toggleThirdPerson();
    mapKeysToAnimation();
    if (isGrounded() || shouldStepUp) {//i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
        playerRigidBody.setLinvel(velocity,true)
    };
    playerPosition = playerRigidBody.translation();
    shouldStepUp = false;
    obstacleHeight = 0
}

let playLandSound = true
function isGrounded() {
    let onGround = false
    const posY = Math.floor(player.position.y)//i used floor instead of round for stability cuz of edge cases caused by precision
    const groundPosY = posY - 1.5;//the ground should be just one cord lower than the player since te player stands over the ground
    const point = {...player.position,y:groundPosY}

    console.log('Point Query Player: ', player.position.y);
    console.log(' Point Query Point:', point.y);
    console.log("Point Query Spawn: ",cube.position.y + cube.scale.y);

    physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
        const collider = physicsWorld.getCollider(colliderObject.handle);
        const shape = collider.shape
        if (shape instanceof RAPIER.Capsule) return true//ignore the player and continue checking
        console.log("PointY Ground: ",point.y);
        console.log('Ground Collider shape:', shape);

        onGround = true
        if (playLandSound) {
            landSound.play();
            playLandSound = false
        }
        return false;//*tune here
    });  
    console.log("Point On Ground?: ",onGround);
    if (!onGround) playLandSound = true;
    return onGround 
}



function detectLowStep() {
    const forward = new THREE.Vector3(0, 0, -1); // Local forward
    const rotation = playerRigidBody.rotation();
    const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    forward.applyQuaternion(quat).normalize();


    const point = new THREE.Vector3(
        playerPosition.x + forward.x * stepCheckDistance,
        playerPosition.y,
        playerPosition.z + forward.z * stepCheckDistance
    );

    physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
        console.log('PointY Obstacle: ', point.y);
        const collider = physicsWorld.getCollider(colliderObject.handle);
        const shape = collider.shape
        console.log('Collider shape:', shape);
        
        if (shape instanceof RAPIER.Cuboid) {
            const halfExtents = shape.halfExtents;
            const height = halfExtents.y * 2;
            obstacleHeight = height;
            console.log('Obstacle height:', height);
            if (height <= maxStepUpHeight) {
                console.log("STEPPING UP");
                shouldStepUp = true
            }
        }
        return true;//*tune here
    });    
}



function updatePlayerAnimations() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
}
function updateCamPerspective() {
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
    mapKeysToPlayer(); 
    updatePlayerAnimations();
    updateCamPerspective();
    updatePlayerTransformations();
    detectLowStep();
    respawnIfOutOfBounds()
}
