import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY} from "../physics-world.three";

export interface FixedControllerData {
    modelPath:string,
    spawnPoint: RAPIER.Vector3,
    characterHeight:number,
    characterWidth:number,
    mass:number,
}
export interface DynamicControllerData {
    maxStepUpHeight:number,
    jumpVelocity:number,
    jumpResistance:number,
    horizontalVelocity:number,
    rotationDelta:number,
    rotationSpeed:number,
    gravityScale:number
}
//i made it an abstract class to prevent it from being directly instantiated to hide internals,ensure that any entity made from this has some behaviour attatched to it not just movement code and to expose a simple innterface to update the character through a hook that cant be passed to the constrcutor because it uses the this binding context.another benefit of using the hook is that it creates a consistent interface for updating all characters since a common function calls these abstract hooks
export abstract class Controller {
    protected dynamicData:DynamicControllerData;//needs to be protected so that the class methods can change its parameters like speed dynamically but not public to ensure that there is a single source of truth for these updates
    private fixedData:FixedControllerData;//this is private cuz the data here cant or shouldnt be changed after the time of creation for stability
    private character: THREE.Group<THREE.Object3DEventMap>//made it private to prevent mutation but added a getter for it to be added to the scene
    private characterColliderHandle:number;

    private obtscaleDetectionDistance:number;
    private groundDetectionDistance:number;
    private listener: THREE.AudioListener;
    private velocity:THREE.Vector3;
    private targetRotation:THREE.Euler;
    private targetQuaternion:THREE.Quaternion;
    private characterPosition:RAPIER.Vector3
    private characterCollider: RAPIER.ColliderDesc
    private characterBody: RAPIER.RigidBodyDesc;
    private characterRigidBody:RAPIER.RigidBody;
    private obstacleHeight: number
    private playLandSound: boolean;
    private clock:THREE.Clock;
    private currentAction: THREE.AnimationAction | null;

    private shouldStepUp: boolean
    private mixer: THREE.AnimationMixer | null;
    private idleAction: THREE.AnimationAction | null;
    private walkAction: THREE.AnimationAction | null;
    private jumpAction:THREE.AnimationAction | null;
    private shouldPlayJumpAnimation: boolean;
    private walkSound: THREE.PositionalAudio;//the inheriting class can only access this sound through exposed methods
    private landSound: THREE.PositionalAudio;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity

    
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        const halfHeight = fixedData.characterHeight/2;
        this.fixedData = fixedData
        this.dynamicData = dynamicData

        this.velocity = new THREE.Vector3(0,0,0);
        this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.targetQuaternion = new THREE.Quaternion();

        this.character = new THREE.Group();
        this.characterPosition = this.fixedData.spawnPoint
        this.characterCollider = RAPIER.ColliderDesc.capsule(halfHeight,this.fixedData.characterWidth);
        this.characterBody = RAPIER.RigidBodyDesc.dynamic()
        this.characterBody.mass = this.fixedData.mass;

        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        this.characterColliderHandle = physicsWorld.createCollider(this.characterCollider,this.characterRigidBody).handle;
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

        this.groundDetectionDistance = halfHeight + 0.5 + ((halfHeight%2) * 0.5);
        this.obtscaleDetectionDistance = 4.5;
        this.loadCharacterModel()
    }
    private loadCharacterModel() {
        const loader:GLTFLoader = new GLTFLoader();
        loader.load(this.fixedData.modelPath,
            gltf=>{
                const characterModel = gltf.scene
                characterModel.position.z = 0.3
                this.character.add(characterModel);
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
    private fadeToAnimation(newAction: THREE.AnimationAction) {
        if (newAction !== this.currentAction) {
            newAction.reset();
            newAction.play();
            if (this.currentAction) this.currentAction.crossFadeTo(newAction, 0.4, false);
            this.currentAction = newAction;
        }
    }
    private calculateUpwardVelocity() {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = Math.sqrt((2*destinationHeight)/gravityY);
        const upwardVelocity = (destinationHeight/timeToReachHeight) + (0.5 * gravityY * timeToReachHeight);//i chose not to round this one to ensure that i dont shoot not even the slightest over the obstacle
        console.log("Final upward velocity: ",upwardVelocity);
        return upwardVelocity
    }
    private calculateForwardVelocity(upwardVelocity:number) {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = (upwardVelocity/gravityY) + Math.sqrt((2*destinationHeight)/gravityY)
        const forwardVelocity = Math.round(this.obtscaleDetectionDistance/timeToReachHeight)//i rounded this one to ensure that the forward velocity is treated fair enough to move over the obstacle.ceiling it will overshoot it
        console.log("Final forward velocity: ",forwardVelocity);
        return forwardVelocity
    }
    private isGrounded() {
        let onGround = false
        const posY = Math.floor(this.characterPosition.y)//i used floor instead of round for stability cuz of edge cases caused by precision
        const groundPosY = posY - this.groundDetectionDistance;//the ground should be just a few cord lower than the player since te player stands over the ground
        const point = {...this.characterPosition,y:groundPosY}
        
        console.log("Point Ground detection distance: ",this.groundDetectionDistance);
        console.log('Point Query Player: ', this.characterPosition.y);
        console.log(' Point Query Point:', point.y);
    
        physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
            const isCharacterCollider = colliderObject.handle == this.characterColliderHandle;
            console.log("Is character collider: ",isCharacterCollider);
            if (isCharacterCollider) return true;//skip the check for the player and contiune searching for other colliers at that point
            const collider = physicsWorld.getCollider(colliderObject.handle);
            const shape = collider.shape
    
            console.log("PointY Ground: ",point.y);
            console.log('Ground Collider shape:', shape);

            if (this.playLandSound) {
                this.landSound.play();
                this.playLandSound = false
            }
            onGround = true
            return false;//*tune here
        });  
        console.log("Point On Ground?: ",onGround);
        if (!onGround) this.playLandSound = true;
        return onGround 
    }
    private orientPoint(distance:number):THREE.Vector3 {
        const forward = new THREE.Vector3(0, 0, -1); // Local forward
        const rotation = this.characterRigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        forward.applyQuaternion(quat).normalize();
    
        const point = new THREE.Vector3(
            this.characterPosition.x + forward.x * distance,
            this.characterPosition.y-(this.groundDetectionDistance-0.5),//to detect obstacles that are too low
            this.characterPosition.z + forward.z * distance
        );
        return point
    }
    private detectLowObstacle() {
        const point:THREE.Vector3 = this.orientPoint(this.obtscaleDetectionDistance)
        physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
            const collider = physicsWorld.getCollider(colliderObject.handle);
            const shape = collider.shape
            console.log('PointY Obstacle: ', point.y);
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
    private moveOverObstacle() {
        console.log('Attemptig to step up');
        this.shouldPlayJumpAnimation = false;
        const upwardVelocity = this.calculateUpwardVelocity()
        const forwardVelocity = this.calculateForwardVelocity(upwardVelocity)
        this.moveForward(forwardVelocity + this.dynamicData.jumpResistance);//i added jump resistance here because when moving the characyer up,jump resistance resists this forward velocity but what i want is for it to only resist forward velocity when jumping not stepping over
        this.moveCharacterUp(upwardVelocity);
        this.shouldPlayJumpAnimation = false;
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
        if (this.shouldStepUp) this.moveOverObstacle();
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
        this.dynamicData.horizontalVelocity -= this.dynamicData.jumpResistance;
        this.shouldPlayJumpAnimation = true;
    }
    protected moveCharacterDown(velocityDelta:number) {
        const down = new THREE.Vector3(0,-velocityDelta,0);
        down.applyQuaternion(this.character.quaternion);
        this.velocity.add(down);
    }
    protected rotateCharacterX(rotationDelta: number) {
        this.targetRotation.y -= rotationDelta; 
        this.targetQuaternion.setFromEuler(this.targetRotation);
    }


    protected isAirBorne() {
        return !this.isGrounded() && this.shouldPlayJumpAnimation && !this.shouldStepUp
    }
    protected playJumpAnimation() {
        if (this.mixer && this.jumpAction) this.fadeToAnimation(this.jumpAction)
    }
    protected playWalkAnimation() {
        if (this.mixer && this.walkAction) this.fadeToAnimation(this.walkAction)
    }
    protected playIdleAnimation() {
        if (this.mixer && this.idleAction) this.fadeToAnimation(this.idleAction)
    }

    protected playWalkSound() {
        if (!this.walkSound.isPlaying) this.walkSound.play();
    }
    protected stopWalkSound() {
        this.walkSound.stop()
    }

    
    protected addObject(externalObject:THREE.Object3D) {//any object that must be added like a camera for a player should be done through here.it reuqires the class to put any object he wants under a threejs 3d object
        this.character.add(externalObject)
    }
    private updateController() {//i made it private to prevent direct access but added a getter to ensure that it can be read essentially making this function call-only
        this.defineBehaviour();
        this.applyVelocity();
        this.characterRigidBody.setGravityScale(this.dynamicData.gravityScale,true)
        this.updateCharacterAnimations();
        this.updateCharacterTransformations();
        this.resetVariables();
        this.detectLowObstacle();
        this.respawnIfOutOfBounds();
    }
    get updateCharacter() {
        return this.updateController
    }
    get characterController() {
        return this.character
    }
    protected abstract defineBehaviour():void//this is a hook where the entity must be controlled before updating
}