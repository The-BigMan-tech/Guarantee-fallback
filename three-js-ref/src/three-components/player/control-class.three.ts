import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY} from "../physics-world.three";
import { keysPressed,toggleThirdPerson,cameraMode} from "./globals.three";
import { pitchObject } from "./camera.three";

interface FixedControllerData {
    modelPath:string,
    spawnPoint: RAPIER.Vector3,
    characterHeight:number,
    characterWidth:number,
    mass:number,
    groundDetectionDistance:number,
    stepCheckDistance:number,
}
interface DynamicControllerData {
    maxStepUpHeight:number,
    jumpVelocity:number,
    jumpResistance:number,
    horizontalVelocity:number,
    rotationDelta:number,
    rotationSpeed:number,
    camera:THREE.Object3D<THREE.Object3DEventMap> | null
}
class Controller {
    private velocity:THREE.Vector3;
    private targetRotation:THREE.Euler;
    private targetQuaternion:THREE.Quaternion;
    private characterPosition:RAPIER.Vector3
    private characterCollider: RAPIER.ColliderDesc
    private characterBody: RAPIER.RigidBodyDesc;
    private characterRigidBody:RAPIER.RigidBody;
    private listener: THREE.AudioListener;
    private obstacleHeight: number
    private playLandSound: boolean;
    private clock:THREE.Clock;
    private currentAction: THREE.AnimationAction | null;

    private fixedData:FixedControllerData;
    public character: THREE.Group<THREE.Object3DEventMap>
    public dynamicData:DynamicControllerData;

    protected walkSound: THREE.PositionalAudio
    protected landSound: THREE.PositionalAudio;

    protected shouldStepUp: boolean
    protected mixer: THREE.AnimationMixer | null;
    protected idleAction: THREE.AnimationAction | null;
    protected walkAction: THREE.AnimationAction | null;
    protected jumpAction:THREE.AnimationAction | null;
    protected shouldPlayJumpAnimation: boolean;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        this.fixedData = fixedData
        this.dynamicData = dynamicData
        this.velocity = new THREE.Vector3(0,0,0);
        this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.targetQuaternion = new THREE.Quaternion();
        this.character = new THREE.Group();
        this.characterPosition = this.fixedData.spawnPoint
        this.characterCollider = RAPIER.ColliderDesc.capsule(this.fixedData.characterHeight/2,this.fixedData.characterWidth)
        this.characterBody = RAPIER.RigidBodyDesc.dynamic()
        this.characterBody.mass = this.fixedData.mass;
        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        physicsWorld.createCollider(this.characterCollider,this.characterRigidBody);
        this.characterRigidBody.setTranslation(this.characterPosition,true);
        this.clock = new THREE.Clock();
        this.mixer = null;
        this.currentAction = null
        this.idleAction = null
        this.walkAction = null
        this.jumpAction = null
        this.listener = new THREE.AudioListener();
        this.walkSound = new THREE.PositionalAudio(this.listener);
        this.landSound = new THREE.PositionalAudio(this.listener);
        this.shouldPlayJumpAnimation = false;
        this.obstacleHeight = 0;
        this.shouldStepUp = false
        this.playLandSound = true;
        this.loadCharacterModel()
    }
    private loadCharacterModel() {
        const loader:GLTFLoader = new GLTFLoader();
        loader.load(this.fixedData.modelPath,
            gltf=>{
                const characterModel = gltf.scene
                characterModel.position.z = 0.3
                this.character.add(characterModel);
                if (this.dynamicData.camera) this.character.add(this.dynamicData.camera)
                this.character.add(this.listener)
                this.mixer = new AnimationMixer(characterModel);
                this.loadCharacterAnimations(gltf);
                this.loadCharacterSounds();
            },undefined, 
            error =>console.error( error ),
        );
    }
    private loadCharacterAnimations(gltf:GLTF) {
        if (!this.mixer) return;
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
        const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
    
        if (walkClip) this.walkAction = this.mixer.clipAction(walkClip);
        if (jumpClip) this.jumpAction = this.mixer.clipAction(jumpClip);
        if (idleClip) {
            this.idleAction = this.mixer.clipAction(idleClip);
            this.idleAction.play();
            this.currentAction = this.idleAction;
        }
    }
    private loadCharacterSounds() {    
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('walking.mp3',(buffer)=> {
            this.walkSound.setBuffer(buffer);
            this.walkSound.setVolume(40);
        });
        audioLoader.load('landing.mp3',(buffer)=> {
            this.landSound.setBuffer(buffer);
            this.landSound.setVolume(30);
        });
    }
    private calculateUpwardVelocity() {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = Math.sqrt((2*destinationHeight)/gravityY);
        const upwardVelocity = (destinationHeight/timeToReachHeight) + (0.5 * gravityY * timeToReachHeight);
        console.log("Final upward velocity: ",upwardVelocity);
        return upwardVelocity
    }
    private calculateForwardVelocity(upwardVelocity:number) {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = (upwardVelocity/gravityY) + Math.sqrt((2*destinationHeight)/gravityY)
        const forwardVelocity = this.fixedData.stepCheckDistance/timeToReachHeight
        console.log("Final forward velocity: ",forwardVelocity);
        return forwardVelocity
    }
    private moveOverObstacle() {
        console.log('Attemptig to step up');
        this.shouldPlayJumpAnimation = false;
        const upwardVelocity = this.calculateUpwardVelocity()
        const forwardVelocity = this.calculateForwardVelocity(upwardVelocity)
        this.moveForward(forwardVelocity);
        this.moveCharacterUp(upwardVelocity);
    }
    private forceCharacterDown() {//to force the player down if he isnt stepping up and he is in the air while moving forward.the effect of this is seen when the player is stepping down
        if (!this.shouldStepUp && !this.isGrounded()) {
            this.moveCharacterDown(gravityY)
        };
    }
    //im resetting the velocity and impulse every frame to prevent accumulation over time
    private moveForward(velocityDelta:number) {
        const forward = new THREE.Vector3(0,0,-velocityDelta);//direction vector
        forward.applyQuaternion(this.character.quaternion);//setting the direction to the rigid body's world space
        this.velocity.add(forward);
        this.forceCharacterDown()
    }


    protected moveCharacterForward(velocityDelta:number) {
        if (this.shouldStepUp) this.moveOverObstacle()
        else this.moveForward(velocityDelta);
    }
    protected moveCharacterBackward(velocityDelta:number) {
        const backward = new THREE.Vector3(0,0,velocityDelta);
        backward.applyQuaternion(this.character.quaternion);
        this.velocity.add(backward);
        this.forceCharacterDown()
    }
    protected moveCharacterLeft(velocityDelta:number) {
        const left = new THREE.Vector3(-velocityDelta,0,0);
        left.applyQuaternion(this.character.quaternion);
        this.velocity.add(left);
        this.forceCharacterDown()
    }
    protected moveCharacterRight(velocityDelta:number) {
        const right = new THREE.Vector3(velocityDelta,0,0);
        right.applyQuaternion(this.character.quaternion);
        this.velocity.add(right);
        this.forceCharacterDown()
    }
    protected moveCharacterUp(velocityDelta:number) {
        const up = new THREE.Vector3(0,velocityDelta,0);
        up.applyQuaternion(this.character.quaternion);
        this.velocity.add(up);
        this.dynamicData.horizontalVelocity -= this.dynamicData.jumpResistance
    }
    protected moveCharacterDown(velocityDelta:number) {
        const down = new THREE.Vector3(0,-velocityDelta,0);
        down.applyQuaternion(this.character.quaternion);
        this.velocity.add(down);
    }
    protected rotatePlayerX(rotationDelta: number) {
        this.targetRotation.y -= rotationDelta; 
        this.targetQuaternion.setFromEuler(this.targetRotation);
    }
    protected fadeToAnimation(newAction: THREE.AnimationAction) {
        if (newAction !== this.currentAction) {
            newAction.reset();
            newAction.play();
            if (this.currentAction) this.currentAction.crossFadeTo(newAction, 0.4, false);
            this.currentAction = newAction;
        }
    }
    protected isGrounded() {
        let onGround = false
        const posY = Math.floor(this.characterPosition.y)//i used floor instead of round for stability cuz of edge cases caused by precision
        const groundPosY = posY - this.fixedData.groundDetectionDistance;//the ground should be just one cord lower than the player since te player stands over the ground
        const point = {...this.characterPosition,y:groundPosY}
    
        console.log('Point Query Player: ', this.characterPosition.y);
        console.log(' Point Query Point:', point.y);
    
        physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
            const collider = physicsWorld.getCollider(colliderObject.handle);
            const shape = collider.shape
            if (shape instanceof RAPIER.Capsule) return true//ignore the player and continue checking
            console.log("PointY Ground: ",point.y);
            console.log('Ground Collider shape:', shape);
    
            onGround = true
            if (this.playLandSound) {
                this.landSound.play();
                this.playLandSound = false
            }
            return false;//*tune here
        });  
        console.log("Point On Ground?: ",onGround);
        if (!onGround) this.playLandSound = true;
        return onGround 
    }

    
    private detectLowStep() {
        const forward = new THREE.Vector3(0, 0, -1); // Local forward
        const rotation = this.characterRigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        forward.applyQuaternion(quat).normalize();
    
        const point = new THREE.Vector3(
            this.characterPosition.x + forward.x * this.fixedData.stepCheckDistance,
            this.characterPosition.y-1,//to detect obstacles that are too low
            this.characterPosition.z + forward.z * this.fixedData.stepCheckDistance
        );
        
        physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
            console.log('PointY Obstacle: ', point.y);
            const collider = physicsWorld.getCollider(colliderObject.handle);
            const shape = collider.shape
            console.log('Collider shape:', shape);
            
            if (shape instanceof RAPIER.Cuboid) {
                const halfExtents = shape.halfExtents;
                const height = halfExtents.y * 2;
                this.obstacleHeight = height;
                console.log('Obstacle height:', height);
                if (height <= this.dynamicData.maxStepUpHeight) {
                    console.log("STEPPING UP");
                    this.shouldStepUp = true
                }
            }
            return true;//*tune here
        });    
    }
    private applyVelocity() {  //i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
        if (this.isGrounded() || this.shouldStepUp) this.characterRigidBody.setLinvel(this.velocity,true);
        this.characterPosition = this.characterRigidBody.translation();
    }
    private resetVariables() {
        this.velocity.set(0,0,0);//to prevent accumulaion over time
        this.dynamicData.horizontalVelocity = 30
        this.shouldStepUp = false;
        this.obstacleHeight = 0
    }
    private updateCharacterAnimations() {
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
    }
    private updateCharacterTransformations() {
        this.character.position.set(this.characterPosition.x,this.characterPosition.y-1.6,this.characterPosition.z);//i minused 1.6 on the y-axis cuz the model wasnt exactly touching the ground
        this.character.quaternion.slerp(this.targetQuaternion,this.dynamicData.rotationSpeed);
        this.characterRigidBody.setRotation(this.targetQuaternion,true);
    }
    private respawnIfOutOfBounds() {
        if (this.characterPosition.y <= outOfBoundsY) {
            this.characterRigidBody.setTranslation(this.fixedData.spawnPoint,true);
            this.characterPosition = this.characterRigidBody.translation();
            this.character.position.set(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z);
        }
    }
    protected updateCharacter() {
        this.updateCharacterAnimations();
        this.applyVelocity();
        this.updateCharacterTransformations();
        this.resetVariables();
        this.detectLowStep();
        this.respawnIfOutOfBounds();
    }
}
class Player extends Controller {
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData)
    }
    private mapKeysToPlayer() {
        if (keysPressed['Space']) {
            this.moveCharacterUp(this.dynamicData.jumpVelocity)//the linvel made it sluggish so i had to increase the number
            this.shouldPlayJumpAnimation = true;
        }
        if (keysPressed['KeyW']) {
            if (keysPressed['ShiftLeft']) {//for sprinting
                this.dynamicData.horizontalVelocity += 10
            }
            this. moveCharacterForward(this.dynamicData.horizontalVelocity)
        }
        if (keysPressed['KeyS']) {
            this.moveCharacterBackward(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['KeyA']) {
            this.moveCharacterLeft(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['KeyD']) {
            this.moveCharacterRight(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['ArrowLeft'])  {
            this.rotatePlayerX(-this.dynamicData.rotationDelta)
        };  
        if (keysPressed['ArrowRight']) {
            this.rotatePlayerX(+this.dynamicData.rotationDelta)
        };
        toggleThirdPerson();
    }
    private mapKeysToAnimations() {
        if (this.mixer && this.idleAction && this.walkAction && this.jumpAction) {//only play animations if all animations have been loaded siuccesfully
            if (!this.isGrounded() && this.shouldPlayJumpAnimation && !this.shouldStepUp) {
                this.walkSound.stop();
                this.fadeToAnimation(this.jumpAction);
            }else if (keysPressed['KeyW']) {//each key will have its own animation
                if (!this.walkSound.isPlaying) this.walkSound.play();
                this.fadeToAnimation(this.walkAction);
            }else if (keysPressed['KeyA']) {
                if (!this.walkSound.isPlaying) this.walkSound.play();
            }else if (keysPressed['KeyS']) {
                if (!this.walkSound.isPlaying) this.walkSound.play();
            }else if (keysPressed['KeyD']) {
                if (!this.walkSound.isPlaying) this.walkSound.play();
            }else {
                this.walkSound.stop();
                this.fadeToAnimation(this.idleAction);
            }
        }
    }
    private updateCamPerspective() {
        if (!this.dynamicData.camera) return;
        const targetZ = cameraMode.isThirdPerson ? 6 : 0;
        this.dynamicData.camera.position.z += (targetZ - this.dynamicData.camera.position.z) * 0.1; // 0.1 
    }
    public updatePlayer() {
        this.mapKeysToPlayer();
        this.mapKeysToAnimations();
        this.updateCamPerspective();
        this.updateCharacter()
    }
}
const playerFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
    spawnPoint: new RAPIER.Vector3(0,20,0),
    characterHeight:1,
    characterWidth:1,
    mass:40,
    groundDetectionDistance:1.5,
    stepCheckDistance:4.5,
}
const playerDynamicData:DynamicControllerData = {
    maxStepUpHeight:3,
    jumpVelocity:30,
    jumpResistance:15,
    horizontalVelocity:30,
    rotationDelta:0.04,
    rotationSpeed:0.4,
    camera:pitchObject
}
export const player2 = new Player(playerFixedData,playerDynamicData)