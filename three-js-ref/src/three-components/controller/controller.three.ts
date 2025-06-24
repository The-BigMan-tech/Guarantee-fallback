import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY} from "../physics-world.three";
import { scene } from "../scene.three";
import { C } from "vitest/dist/chunks/reporters.d.C1ogPriE.js";

function createCapsuleLine(radius:number,halfHeight:number) {
    const charGeometry = new THREE.CapsuleGeometry(radius,halfHeight*2);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}
function createBoxLine(halfWidth:number,halfHeight:number) {
    const charGeometry = new THREE.BoxGeometry(halfWidth*2,halfHeight*2,halfWidth*2);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}

export interface FixedControllerData {
    modelPath:string,
    spawnPoint: RAPIER.Vector3,
    characterHeight:number,
    characterWidth:number,
    shape:'capsule' | 'box'
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
    private static showHitBoxes = false;
    private static showPoints = true;

    protected dynamicData:DynamicControllerData;//needs to be protected so that the class methods can change its parameters like speed dynamically but not public to ensure that there is a single source of truth for these updates
    private fixedData:FixedControllerData;//this is private cuz the data here cant or shouldnt be changed after the time of creation for stability
    
    private character: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();//made it private to prevent mutation but added a getter for it to be added to the scene
    private characterBody: RAPIER.RigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    private characterPosition:RAPIER.Vector3
    private characterCollider: RAPIER.ColliderDesc
    private characterRigidBody:RAPIER.RigidBody;
    private characterColliderHandle:number;
    private charLine: THREE.LineSegments;

    private modelZOffset:number = 0.3;//this is to offset the model backwards a little from the actual character position so that the legs can be seen in first person properly without having to move the camera
    private modelYOffset:number = 1.6;//i minused 1.6 on the y-axis cuz the model wasnt exactly touching the ground

    private obstacleHeight: number = 0;
    private obstacleDetectionDistance:number = 0;
    private groundDetectionDistance:number;
    
    private velocity:THREE.Vector3 = new THREE.Vector3(0,0,0);
    private targetRotation:THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private targetQuaternion:THREE.Quaternion = new THREE.Quaternion();


    private listener: THREE.AudioListener = new THREE.AudioListener();;
    private playLandSound: boolean = true;
    private walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(this.listener);;//the inheriting class can only access this sound through exposed methods
    private landSound: THREE.PositionalAudio = new THREE.PositionalAudio(this.listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity

    private clock:THREE.Clock = new THREE.Clock();
    private mixer: THREE.AnimationMixer | null = null;
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private walkAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;

    private shouldStepUp: boolean = false;
    private shouldPlayJumpAnimation: boolean = false;

    private originalHorizontalVel:number
    private points:THREE.Object3D = new THREE.Object3D();

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        const halfHeight = Math.round(fixedData.characterHeight)/2;//i rounded the width and height to prevent cases where a class supplied a float for these parameters.the controller was only tested on integers and might break with floats.
        const halfWidth = Math.round(fixedData.characterWidth)/2;
        const radius = halfWidth * 2
        const increasedHalfWidth = halfWidth + 0.5;//i used this in the box collider creation to ensure that it is as volumetric as its capsule counterpart
        const increasedHalfHeight = halfHeight + 0.5;//same thing goes for here

        this.fixedData = fixedData
        this.dynamicData = dynamicData
        this.characterPosition = this.fixedData.spawnPoint

        if (this.fixedData.shape == 'capsule') {
            this.characterCollider = RAPIER.ColliderDesc.capsule(halfHeight,radius);
            this.charLine = createCapsuleLine(radius,halfHeight)
        }else {
            this.characterCollider = RAPIER.ColliderDesc.cuboid(increasedHalfWidth,increasedHalfHeight,increasedHalfWidth);
            this.charLine = createBoxLine(increasedHalfWidth,increasedHalfHeight)
        }
        this.charLine.position.set(0,2,this.modelZOffset)//the offset is to ensure its accurate visually
        if (Controller.showHitBoxes) this.character.add(this.charLine);

        this.characterBody.mass = this.fixedData.mass;
        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        this.characterColliderHandle = physicsWorld.createCollider(this.characterCollider,this.characterRigidBody).handle;
        this.characterRigidBody.setTranslation(this.characterPosition,true);

        this.groundDetectionDistance = halfHeight + 0.5 + ((halfHeight%2) * 0.5);//i didnt just guess this from my head.i made the formula after trying different values and recording the ones that correctly matched a given character height,saw a pattern and crafted a formula for it
        this.originalHorizontalVel = dynamicData.horizontalVelocity;
        this.loadCharacterModel();
    }
    private loadCharacterModel():void {
        const loader:GLTFLoader = new GLTFLoader();
        loader.load(this.fixedData.modelPath,
            gltf=>{
                const characterModel = gltf.scene
                characterModel.position.z = this.modelZOffset;
                this.character.add(characterModel);
                this.character.add(this.listener)
                this.mixer = new AnimationMixer(characterModel);
                this.loadCharacterAnimations(gltf);
                this.loadCharacterSounds();
            },undefined, 
            error =>console.error( error ),
        );
    }
    private loadCharacterAnimations(gltf:GLTF):void {
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
    private loadCharacterSounds():void {    
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
    private fadeToAnimation(newAction: THREE.AnimationAction):void {
        if (newAction !== this.currentAction) {
            newAction.reset();
            newAction.play();
            if (this.currentAction) this.currentAction.crossFadeTo(newAction, 0.4, false);
            this.currentAction = newAction;
        }
    }


    private calculateUpwardVelocity():number {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = Math.sqrt((2*destinationHeight)/gravityY);
        const upwardVelocity = (destinationHeight/timeToReachHeight) + (0.5 * gravityY * timeToReachHeight);//i chose not to round this one to ensure that i dont shoot not even the slightest over the obstacle
        console.log("Final upward velocity: ",upwardVelocity);
        return upwardVelocity
    }
    private calculateForwardVelocity(upwardVelocity:number):number {
        const destinationHeight = Math.round(this.obstacleHeight)
        const timeToReachHeight = (upwardVelocity/gravityY) + Math.sqrt((2*destinationHeight)/gravityY)
        const forwardVelocity = Math.round(this.obstacleDetectionDistance/timeToReachHeight)//i rounded this one to ensure that the forward velocity is treated fair enough to move over the obstacle.ceiling it will overshoot it
        console.log("Final forward velocity: ",forwardVelocity);
        return forwardVelocity
    }
    /**
     *  for cubes with heights that can be rounded to a higher integer,flooring it solves the problem of small precision issues that can prevent ground detection.
        //but for cubes with heights that cant be rounded to a higher integer,precision gets more messy that flooring cant solve it.so after a feedback loop,i realized that they require a constant deduction of 1.
        //the two techniques for the different types of floats ensures that all floats are aggressively reduced to a number way smaller than them in terms of precision.This esnures that a number like 2.3,gets reduced 1.3 and a number of 2.6 gets reduced to 2.
        //Because point querying is very sensitive to precisison no matter how small,my approach is to make it insensitive to precision by aggressively reducing floats before working with them but not too much so that it loses its meaning entirely by overshooting to another point that clearly isnt what im querying for
        //ground detection distance is a one decimal float calculated by using the character height against a function.after reducing precision to a certain point but not too much to get the point most likely the player is standing on,subtracting this distance gets the right point that the ground is.
     * 
     */
    private calculateGroundPosition() {
        const charPosY = this.characterPosition.y
        const isRoundable = Math.round(charPosY) > charPosY
        const posY = (isRoundable)?Math.floor(charPosY):charPosY-1
        const groundPosY = posY - this.groundDetectionDistance;//the ground should be just a few cord lower than the player since te player stands over the ground
        console.log("Point is Roundable: ",isRoundable);
        console.log('Point Query Player: ',charPosY);
        return groundPosY
    }
    private colorPoint(position:THREE.Vector3, color:number) {
        if (!Controller.showPoints) return;
        const geometry = new THREE.SphereGeometry(0.06,8,8); // Small sphere
        const material = new THREE.MeshBasicMaterial({ color: color });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position); // Set position
        this.points.add(point);
    }
    private colorGroundPoint() {//i rounded the height cuz the point doesnt always exactly touch the ground
        const point:THREE.Vector3 = new THREE.Vector3(this.characterPosition.x,Math.round(this.calculateGroundPosition()),this.characterPosition.z);
        this.colorPoint(point,0x000000)
    }


    private isGrounded():boolean {
        if (this.characterRigidBody.isSleeping()) return true;//to prevent unnecessary queries when the update loop calls it to know whether to force sleep force sleep.
        const point:THREE.Vector3 = new THREE.Vector3(this.characterPosition.x,this.calculateGroundPosition(),this.characterPosition.z)
        let onGround = false

        console.log("Point Ground detection distance: ",this.groundDetectionDistance);
        console.log(' Point Query Point:',point.y);
    
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


    private orientPoint(distance:number,directionVector:THREE.Vector3):THREE.Vector3 {
        const rotation = this.characterRigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const dir = directionVector.clone().applyQuaternion(quat).normalize();
    
        const point = new THREE.Vector3(
            this.characterPosition.x + (dir.x * distance),
            this.characterPosition.y - (this.groundDetectionDistance-0.5),//to detect obstacles that are too low
            this.characterPosition.z + (dir.z * distance)
        );
        return point
    }
    private updateObstacleDetectionDistance() {
        const delta = this.clock.getDelta();
        const margin = 4; // tune as needed
        this.obstacleDetectionDistance = (this.dynamicData.horizontalVelocity * delta) + margin
        console.log("Obstacle detection distance: ",this.obstacleDetectionDistance);
    }
    private getSteps(maxDistance:number,density:number) {
        let steps = Math.floor(maxDistance * density);
        const minSteps = 4;
        const maxSteps = 10;
        steps = Math.min(Math.max(steps, minSteps), maxSteps);
        return steps
    }


    private detectLowObstacle():void {
        const forward = new THREE.Vector3(0,0,-1);
        const maxDistance = this.obstacleDetectionDistance;
        const pointDensity = 1.2
        const steps = this.getSteps(maxDistance,pointDensity);

        let hasCollided = false
        for (let i = 1; i <= steps; i++) {
            if (hasCollided) break;
            const distance = (maxDistance / steps) * i;
            const point:THREE.Vector3 = this.orientPoint(distance,forward);
            this.colorPoint(point,0x000000);

            physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
                const collider = physicsWorld.getCollider(colliderObject.handle);
                const shape = collider.shape
                console.log('PointY Obstacle: ', point.y);
                console.log('Obstacle Collider shape:', shape);

                if (shape instanceof RAPIER.Cuboid) {
                    hasCollided = true;
                    const groundPosY = Math.max(0,this.calculateGroundPosition());//to clamp negative ground pos to 0 to prevent the relative height from being higher than the actual cube height when negative
                    const stepOverPosY = (groundPosY+this.dynamicData.maxStepUpHeight) + 1//the +1 checks for the point just above this
                    const stepOverPos = new THREE.Vector3(point.x,stepOverPosY,point.z)
                    let clearance = true;

                    physicsWorld.intersectionsWithPoint(stepOverPos, () => {
                        clearance = false
                        return false
                    })

                    if (clearance) {
                        console.log("STEPPING UP");
                        this.obstacleHeight = 2;
                        this.shouldStepUp = true;

                        for (let i=0;i <= this.dynamicData.maxStepUpHeight;i++) {
                            stepOverPos.sub(new THREE.Vector3(0,1,0));
                            physicsWorld.intersectionsWithPoint(stepOverPos,()=>{
                                const relativeHeight = Math.floor(stepOverPos.y) - Math.ceil(groundPosY)
                                console.log('Relative groundPosY:', groundPosY);
                                console.log('Relative stepOverPos.y:', stepOverPos.y);
                                console.log("Relative height: ",relativeHeight);
                                return true
                            })
                        }
                                                
                    }
                }
                return true;//*tune here
            });    
        }
    }


    private applyVelocity():void {  //i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
        if (this.isGrounded() || this.shouldStepUp) this.characterRigidBody.setLinvel(this.velocity,true);
        this.characterPosition = this.characterRigidBody.translation();
    }
    private resetVariables():void {
        this.velocity.set(0,0,0);//to prevent accumulaion over time
        this.dynamicData.horizontalVelocity = this.originalHorizontalVel;//the horizontal velocity is subject to runtime mutations so i have to reset it
        this.shouldStepUp = false;
        this.obstacleHeight = 0
    }
    private updateCharacterAnimations():void {
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
    }
    private updateCharacterTransformations():void {
        const [posX,posY,posZ] = [this.characterPosition.x,this.characterPosition.y-this.modelYOffset,this.characterPosition.z];
        this.character.position.set(posX,posY,posZ);
        this.character.quaternion.slerp(this.targetQuaternion,this.dynamicData.rotationSpeed);
        this.characterRigidBody.setRotation(this.targetQuaternion,true);
    }
    private respawnIfOutOfBounds():void {
        if (this.characterPosition.y <= outOfBoundsY) {
            this.characterRigidBody.setTranslation(this.fixedData.spawnPoint,true);
            this.characterPosition = this.characterRigidBody.translation();
            this.character.position.set(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z);
        }
    }


    private forceCharacterDown():void {//to force the player down if he isnt stepping up and he is in the air while moving forward.the effect of this is seen when the player is stepping down
        if (!this.shouldStepUp && !this.isGrounded()) {
            this.moveCharacterDown(gravityY)
        };
    }
    private moveOverObstacle():void {
        console.log('Attemptig to step up');
        this.shouldPlayJumpAnimation = false;
        const upwardVelocity = this.calculateUpwardVelocity()
        const forwardVelocity = this.calculateForwardVelocity(upwardVelocity)
        this.moveForward(forwardVelocity + this.dynamicData.jumpResistance);//i added jump resistance here because when moving the characyer up,jump resistance resists this forward velocity but what i want is for it to only resist forward velocity when jumping not stepping over
        this.moveCharacterUp(upwardVelocity);
        this.shouldPlayJumpAnimation = false;
    }
    //im resetting the velocity and impulse every frame to prevent accumulation over time
    private moveForward(velocityDelta:number):void {
        const forward = new THREE.Vector3(0,0,-velocityDelta);//direction vector
        forward.applyQuaternion(this.character.quaternion);//setting the direction to the rigid body's world space
        this.velocity.add(forward);
        this.forceCharacterDown()
    }


    private wakeUpBody() {
        if ( this.characterRigidBody.isSleeping()) this.characterRigidBody.wakeUp();
    }
    protected moveCharacterForward(velocityDelta:number):void {
        this.wakeUpBody()
        if (this.shouldStepUp) this.moveOverObstacle();
        else this.moveForward(velocityDelta);
    }
    protected moveCharacterBackward(velocityDelta:number):void {
        this.wakeUpBody()
        const backward = new THREE.Vector3(0,0,velocityDelta);
        backward.applyQuaternion(this.character.quaternion);
        this.velocity.add(backward);
        this.forceCharacterDown();
    }
    protected moveCharacterLeft(velocityDelta:number):void {
        this.wakeUpBody()
        const left = new THREE.Vector3(-velocityDelta,0,0);
        left.applyQuaternion(this.character.quaternion);
        this.velocity.add(left);
        this.forceCharacterDown();
    }
    protected moveCharacterRight(velocityDelta:number):void {
        this.wakeUpBody()
        const right = new THREE.Vector3(velocityDelta,0,0);
        right.applyQuaternion(this.character.quaternion);
        this.velocity.add(right);
        this.forceCharacterDown();
    }
    protected moveCharacterUp(velocityDelta:number):void {
        this.wakeUpBody();
        const up = new THREE.Vector3(0,velocityDelta,0);
        up.applyQuaternion(this.character.quaternion);
        this.velocity.add(up);
        this.dynamicData.horizontalVelocity -= this.dynamicData.jumpResistance;
        this.shouldPlayJumpAnimation = true;
    }
    protected moveCharacterDown(velocityDelta:number):void {
        this.wakeUpBody();
        const down = new THREE.Vector3(0,-velocityDelta,0);
        down.applyQuaternion(this.character.quaternion);
        this.velocity.add(down);
    }
    protected rotateCharacterX(rotationDelta: number):void {
        this.wakeUpBody();
        this.targetRotation.y -= rotationDelta; 
        this.targetQuaternion.setFromEuler(this.targetRotation);
    }


    protected isAirBorne():boolean {
        return !this.isGrounded() && this.shouldPlayJumpAnimation && !this.shouldStepUp
    }
    protected playJumpAnimation():void {
        if (this.mixer && this.jumpAction) this.fadeToAnimation(this.jumpAction)
    }
    protected playWalkAnimation():void {
        if (this.mixer && this.walkAction) this.fadeToAnimation(this.walkAction)
    }
    protected playIdleAnimation():void {
        if (this.mixer && this.idleAction) this.fadeToAnimation(this.idleAction)
    }

    protected playWalkSound():void {
        if (!this.walkSound.isPlaying) this.walkSound.play();
    }
    protected stopWalkSound():void {
        this.walkSound.stop()
    }

    

    protected addObject(externalObject:THREE.Object3D):void {//any object that must be added like a camera for a player should be done through here.it reuqires the class to put any object he wants under a threejs 3d object
        this.character.add(externalObject)
    }
    protected removeObject(externalObject:THREE.Object3D):void {
        this.character.remove(externalObject)
    }


    private forceSleepIfIdle() {
        // im forcing the character rigid body to sleep when its on the ground to prevent extra computation for the physics engine and to prevent the character from consistently querying the engine for ground or obstacle checks.doing it when the entity is grounded is the best point for this.but if the character is on the ground but he wants to move.so what i did was that every exposed method to the inheriting class that requires modification to the rigid body will forcefully wake it up before proceeding.i dont have to wake up the rigid body in other exposed functions that dont affect the rigid body.and i cant wake up the rigid body constantly at a point in the update loop even where calculations arent necessary cuz the time of sleep may be too short.so by doing it the way i did,i ensure that the rigid body sleeps only when its idle. i.e not updated by the inheriting class.this means that the player body isnt simulated till i move it or jump.
        if (this.isGrounded() && !this.characterRigidBody.isSleeping()) {
            this.characterRigidBody.sleep();
        } 
    }
    //in this controller,order of operations and how they are performed are very sensitive to its accuracy.so the placement of these commands in the update loop were crafted with care.be cautious when changing it in the future.but the inheriting classes dont need to think about the order they perform operations on their respective controllers cuz their functions that operate on the controller are hooked properly into the controller's update loop and actual modifications happens in the controller under a crafted environment not in the inheriting class code.so it meands that however in which order they write the behaviour of their controllers,it will always yield the same results
    private updateController():void {//i made it private to prevent direct access but added a getter to ensure that it can be read essentially making this function call-only
        this.forceSleepIfIdle();
        this.defineBehaviour();
        this.updateCharacterAnimations();//im updating the animation before the early return so that it stops naturally 
        if (this.characterRigidBody.isSleeping()) {
            console.log("sleeping...");
            return;//to prevent unnecessary queries.Since it sleeps only when its grounded.its appropriate to return true here saving computation
        }else {
            this.points.clear();
            this.applyVelocity();
            this.updateObstacleDetectionDistance();
            // this.colorGroundPoint();//i made color ground point its own separate function and called it once in the update loop cuz its called in th eupdate loop for decisions more than once
            this.characterRigidBody.setGravityScale(this.dynamicData.gravityScale,true)
            this.updateCharacterTransformations();
            this.resetVariables();
            this.detectLowObstacle();
            this.respawnIfOutOfBounds();
        }
    }
    get updateCharacter():() => void {
        return this.updateController
    }
    get characterController():THREE.Group {
        scene.add(this.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created
        return this.character
    }
    protected abstract defineBehaviour():void//this is a hook where the entity must be controlled before updating
}