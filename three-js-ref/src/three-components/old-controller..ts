// import * as THREE from "three"
// import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
// import { pitchObject } from "./camera.three";
// import { cameraMode,keysPressed, toggleThirdPerson } from "./globals.three";
// import { gravityY } from "../physics-world.three";
// import { AnimationMixer } from 'three';
// import * as RAPIER from '@dimforge/rapier3d'
// import { physicsWorld ,outOfBoundsY} from "../physics-world.three";
// import { cube } from "../terrain.three";


// const maxStepUpHeight = 3//*tune here
// const stepCheckDistance = 4.5; //im using a positive offset because the forward vector already points forward.
// const spawnPoint = new RAPIER.Vector3(0,20,0)
// const characterHeight = 1
// const characterWidth = 1
// const mass = 40
// const modelPath:string = './silvermoon.glb';

// const velocity:THREE.Vector3 = new THREE.Vector3(0,0,0);
// const jumpVelocity = 30;
// const jumpResistance = 15;//this is to prevent the player from going way passed the intended place to jump to because of velocity
// let horizontalVelocity = 30;

// const targetRotation =  new THREE.Euler(0, 0, 0, 'YXZ');
// const targetQuaternion = new THREE.Quaternion();
// const rotationDelta = 0.04;
// const rotationSpeed = 0.4;

// const groundDetectionDistance = 1.5


// //Player group and positioning
// export const player = new THREE.Group();//dont directly control the player position.do it through the rigid body
// let playerPosition:RAPIER.Vector3 = spawnPoint;//so that the player spawns high enough to fall on top of a block not inbetween


// //Physics body creation
// const playerCollider = RAPIER.ColliderDesc.capsule(characterHeight/2,characterWidth);
// const playerBody = RAPIER.RigidBodyDesc.dynamic();
// playerBody.mass = mass

// const playerRigidBody = physicsWorld.createRigidBody(playerBody)
// physicsWorld.createCollider(playerCollider,playerRigidBody);
// playerRigidBody.setTranslation(playerPosition,true);


// //Animation references
// const clock = new THREE.Clock();
// let mixer: THREE.AnimationMixer;
// let currentAction: THREE.AnimationAction | null = null;
// let idleAction: THREE.AnimationAction | null = null;
// let walkAction: THREE.AnimationAction | null = null;
// let jumpAction:THREE.AnimationAction | null = null;


// const listener = new THREE.AudioListener();
// const walkSound = new THREE.PositionalAudio(listener);
// const landSound = new THREE.PositionalAudio(listener);

// //Global variables
// let shouldPlayJumpAnimation = false;
// let obstacleHeight = 0;
// let shouldStepUp = false;
// let playLandSound = true


// //Functions
// loadPlayerModel();
// function loadPlayerModel() {
//     const loader:GLTFLoader = new GLTFLoader();
//     loader.load(modelPath,
//         gltf=>{
//             const playerModel = gltf.scene
//             playerModel.position.z = 0.3
//             player.add(playerModel);
//             // player.add(pitchObject)
//             player.add(listener)
//             mixer = new AnimationMixer(playerModel);
//             loadPlayerAnimations(gltf);
//             loadCharacterSounds();
//         },undefined, 
//         error =>console.error( error ),
//     );
// }
// function loadPlayerAnimations(gltf:GLTF) {
//     const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
//     const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
//     const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 

//     if (walkClip) walkAction = mixer.clipAction(walkClip);
//     if (jumpClip) jumpAction = mixer.clipAction(jumpClip);
//     if (idleClip) {
//         idleAction = mixer.clipAction(idleClip);
//         idleAction.play();
//         currentAction = idleAction;
//     }
// }
// function loadCharacterSounds() {    
//     const audioLoader = new THREE.AudioLoader();
//     audioLoader.load('walking.mp3',(buffer)=> {
//         walkSound.setBuffer(buffer);
//         walkSound.setVolume(40);
//     });
//     audioLoader.load('landing.mp3',(buffer)=> {
//         landSound.setBuffer(buffer);
//         landSound.setVolume(30);
//     });
// }

// function fadeToAnimation(newAction: THREE.AnimationAction) {
//     if (newAction !== currentAction) {
//         newAction.reset();
//         newAction.play();
//         if (currentAction) currentAction.crossFadeTo(newAction, 0.4, false);
//         currentAction = newAction;
//     }
// }
// function forcePlayerDown() {//to force the player down if he isnt stepping up and he is in the air while moving forward.the effect of this is seen when the player is stepping down
//     if (!shouldStepUp && !isGrounded()) {
//         movePlayerDown(gravityY)
//     };
// }
// //im resetting the velocity and impulse every frame to prevent accumulation over time
// function moveForward(velocityDelta:number) {
//     const forward = new THREE.Vector3(0,0,-velocityDelta);//direction vector
//     forward.applyQuaternion(player.quaternion);//setting the direction to the rigid body's world space
//     velocity.add(forward);
//     forcePlayerDown()
// }
// function moveCharacterForward(velocityDelta:number) {
//     if (shouldStepUp) moveOverObstacle()
//     else moveForward(velocityDelta);
// }
// function movePlayerBackward(velocityDelta:number) {
//     const backward = new THREE.Vector3(0,0,velocityDelta);
//     backward.applyQuaternion(player.quaternion);
//     velocity.add(backward);
//     forcePlayerDown()
// }
// function movePlayerLeft(velocityDelta:number) {
//     const left = new THREE.Vector3(-velocityDelta,0,0);
//     left.applyQuaternion(player.quaternion);
//     velocity.add(left);
//     forcePlayerDown()
// }
// function movePlayerRight(velocityDelta:number) {
//     const right = new THREE.Vector3(velocityDelta,0,0);
//     right.applyQuaternion(player.quaternion);
//     velocity.add(right);
//     forcePlayerDown()
// }
// function movePlayerUp(velocityDelta:number) {
//     const up = new THREE.Vector3(0,velocityDelta,0);
//     up.applyQuaternion(player.quaternion);
//     velocity.add(up);
//     horizontalVelocity -= jumpResistance
// }
// function movePlayerDown(velocityDelta:number) {
//     const down = new THREE.Vector3(0,-velocityDelta,0);
//     down.applyQuaternion(player.quaternion);
//     velocity.add(down);
// }
// export function rotatePlayerX(rotationDelta: number) {
//     targetRotation.y -= rotationDelta; 
//     targetQuaternion.setFromEuler(targetRotation);
// }


// function calculateUpwardVelocity() {
//     const destinationHeight = Math.round(obstacleHeight)
//     const timeToReachHeight = Math.sqrt((2*destinationHeight)/gravityY);
//     const upwardVelocity = (destinationHeight/timeToReachHeight) + (0.5 * gravityY * timeToReachHeight);
//     console.log("Final upward velocity: ",upwardVelocity);
//     return upwardVelocity
// }
// function calculateForwardVelocity(upwardVelocity:number) {
//     const destinationHeight = Math.round(obstacleHeight)
//     const timeToReachHeight = (upwardVelocity/gravityY) + Math.sqrt((2*destinationHeight)/gravityY)
//     const forwardVelocity = stepCheckDistance/timeToReachHeight
//     console.log("Final forward velocity: ",forwardVelocity);
//     return forwardVelocity
// }
// function moveOverObstacle() {
//     console.log('Attemptig to step up');
//     shouldPlayJumpAnimation = false;
//     const upwardVelocity = calculateUpwardVelocity()
//     const forwardVelocity = calculateForwardVelocity(upwardVelocity)
//     moveForward(forwardVelocity);
//     movePlayerUp(upwardVelocity);
// }


// function isGrounded() {
//     let onGround = false
//     const posY = Math.floor(playerPosition.y)//i used floor instead of round for stability cuz of edge cases caused by precision
//     const groundPosY = posY - groundDetectionDistance;//the ground should be just one cord lower than the player since te player stands over the ground
//     const point = {...playerPosition,y:groundPosY}

//     console.log('Point Query Player: ', playerPosition.y);
//     console.log(' Point Query Point:', point.y);
//     console.log("Point Query Spawn: ",cube.position.y + cube.scale.y);

//     physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
//         const collider = physicsWorld.getCollider(colliderObject.handle);
//         const shape = collider.shape
//         if (shape instanceof RAPIER.Capsule) return true//ignore the player and continue checking
//         console.log("PointY Ground: ",point.y);
//         console.log('Ground Collider shape:', shape);

//         onGround = true
//         if (playLandSound) {
//             landSound.play();
//             playLandSound = false
//         }
//         return false;//*tune here
//     });  
//     console.log("Point On Ground?: ",onGround);
//     if (!onGround) playLandSound = true;
//     return onGround 
// }


// function detectLowStep() {
//     const forward = new THREE.Vector3(0, 0, -1); // Local forward
//     const rotation = playerRigidBody.rotation();
//     const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
//     forward.applyQuaternion(quat).normalize();

//     const point = new THREE.Vector3(
//         playerPosition.x + forward.x * stepCheckDistance,
//         playerPosition.y-1,//to detect obstacles that are too low
//         playerPosition.z + forward.z * stepCheckDistance
//     );
    
//     physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
//         console.log('PointY Obstacle: ', point.y);
//         const collider = physicsWorld.getCollider(colliderObject.handle);
//         const shape = collider.shape
//         console.log('Collider shape:', shape);
        
//         if (shape instanceof RAPIER.Cuboid) {
//             const halfExtents = shape.halfExtents;
//             const height = halfExtents.y * 2;
//             obstacleHeight = height;
//             console.log('Obstacle height:', height);
//             if (height <= maxStepUpHeight) {
//                 console.log("STEPPING UP");
//                 shouldStepUp = true
//             }
//         }
//         return true;//*tune here
//     });    
// }
// function applyVelocity() { 
//     //i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
//     if (isGrounded() || shouldStepUp) playerRigidBody.setLinvel(velocity,true);
//     playerPosition = playerRigidBody.translation();
// }
// function resetVariables() {
//     velocity.set(0,0,0);//to prevent accumulaion over time
//     horizontalVelocity = 30
//     shouldStepUp = false;
//     obstacleHeight = 0
// }
// function updatePlayerAnimations() {
//     const delta = clock.getDelta();
//     if (mixer) mixer.update(delta);
// }
// function updatePlayerTransformations() {
//     player.position.set(playerPosition.x,playerPosition.y-1.6,playerPosition.z);//i minused 1.6 on the y-axis cuz the model wasnt exactly touching the ground
//     player.quaternion.slerp(targetQuaternion, rotationSpeed);
//     playerRigidBody.setRotation(targetQuaternion,true);
// }
// function respawnIfOutOfBounds() {
//     if (playerPosition.y <= outOfBoundsY) {
//         playerRigidBody.setTranslation(spawnPoint,true);
//         playerPosition = playerRigidBody.translation();
//         player.position.set(playerPosition.x,playerPosition.y,playerPosition.z);
//     }
// }
// export function updatePlayer() {
//     mapKeysToPlayer(); 
//     mapKeysToAnimation();
//     updateCamPerspective();
    
//     updatePlayerAnimations();
//     applyVelocity();
//     updatePlayerTransformations();
//     resetVariables();
//     detectLowStep();
//     respawnIfOutOfBounds();
// }


// function mapKeysToPlayer() {
//     if (keysPressed['Space']) {
//         movePlayerUp(jumpVelocity)//the linvel made it sluggish so i had to increase the number
//         shouldPlayJumpAnimation = true;
//     }
//     if (keysPressed['KeyW']) {
//         if (keysPressed['ShiftLeft']) {//for sprinting
//             horizontalVelocity += 10
//         }
//         moveCharacterForward(horizontalVelocity)
//     }
//     if (keysPressed['KeyS']) {
//         movePlayerBackward(horizontalVelocity);
//     }
//     if (keysPressed['KeyA']) {
//         movePlayerLeft(horizontalVelocity);
//     }
//     if (keysPressed['KeyD']) {
//         movePlayerRight(horizontalVelocity);
//     }
//     if (keysPressed['ArrowLeft'])  {
//         rotatePlayerX(-rotationDelta)
//     };  
//     if (keysPressed['ArrowRight']) {
//         rotatePlayerX(+rotationDelta)
//     };
//     toggleThirdPerson();
// }
// function mapKeysToAnimation() {
//     if (mixer && idleAction && walkAction && jumpAction) {//only play animations if all animations have been loaded siuccesfully
//         if (!isGrounded() && shouldPlayJumpAnimation && !shouldStepUp) {
//             walkSound.stop();
//             fadeToAnimation(jumpAction);
//         }else if (keysPressed['KeyW']) {//each key will have its own animation
//             if (!walkSound.isPlaying) walkSound.play();
//             fadeToAnimation(walkAction);
//         }else if (keysPressed['KeyA']) {
//             if (!walkSound.isPlaying) walkSound.play();
//         }else if (keysPressed['KeyS']) {
//             if (!walkSound.isPlaying) walkSound.play();
//         }else if (keysPressed['KeyD']) {
//             if (!walkSound.isPlaying) walkSound.play();
//         }else {
//             walkSound.stop();
//             fadeToAnimation(idleAction);
//         }
//     }
// }
// function updateCamPerspective() {
//     const targetZ = cameraMode.isThirdPerson ? 6 : 0;
//     pitchObject.position.z += (targetZ - pitchObject.position.z) * 0.1; // 0.1 
// }