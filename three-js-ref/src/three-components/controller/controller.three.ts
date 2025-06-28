import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY} from "../physics-world.three";
import { scene } from "../scene.three";

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
    rotationDelta:number,//angle in radians
    rotationSpeed:number,
    gravityScale:number
}
export interface CollisionMap {
    start:string,
    target:string,
    points:string[]
}
//*The ground position calculation may break for an arbritary charcter height.a stable and tested height is 2. 1,3 and 4 have been played tested and are smooth but the ground check jitters a little between false and true cuz jumping from the ground at times at these values feels uresponsive
//i made it an abstract class to prevent it from being directly instantiated to hide internals,ensure that any entity made from this has some behaviour attatched to it not just movement code and to expose a simple innterface to update the character through a hook that cant be passed to the constrcutor because it uses the this binding context.another benefit of using the hook is that it creates a consistent interface for updating all characters since a common function calls these abstract hooks
export abstract class Controller {
    private static showHitBoxes = false;//the hitboxes are a bit broken
    private static showPoints = false;

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

    private obstacleHeight: number = 0;//0 means there is no obstacle infront of the player,a nmber above this means there is an obstacle but the character can walk over it,infinty means that tere is an obstacle and the character cant walk over it
    private obstacleDetectionDistance:number = 0;
    private groundDetectionDistance:number;
    
    private velocity:THREE.Vector3 = new THREE.Vector3(0,0,0);
    private targetRotation:THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private targetQuaternion:THREE.Quaternion = new THREE.Quaternion();


    private listener: THREE.AudioListener = new THREE.AudioListener();;
    private playLandSound: boolean = true;
    private walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(this.listener);;//the inheriting class can only access this sound through exposed methods
    private landSound: THREE.PositionalAudio = new THREE.PositionalAudio(this.listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity

    protected clock:THREE.Clock = new THREE.Clock();
    private mixer: THREE.AnimationMixer | null = null;
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private walkAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;

    private shouldStepUp: boolean = false;
    private shouldPlayJumpAnimation: boolean = false;

    private originalHorizontalVel:number
    private points:THREE.Object3D = new THREE.Object3D();
    private pointDensity = 1.2;

    private obstacleDistance:number = 0;//unlike obstacledetection distance which is a fixed unit telling the contoller how far to detect obstacles ahead of time,this one actually tells the realtime distance of an obstacle form the controller
    private obstacleWidth:number = 0;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        const halfHeight = Math.round(fixedData.characterHeight)/2;//i rounded the width and height to prevent cases where a class supplied a float for these parameters.the controller was only tested on integers and might break with floats.
        const halfWidth = Math.round(fixedData.characterWidth)/2;
        const radius = halfWidth * 2
        const increasedHalfWidth = halfWidth + 0.5;//i used this in the box collider creation to ensure that it is as volumetric as its capsule counterpart
        const increasedHalfHeight = halfHeight + 0.5;//same thing goes for here

        this.fixedData = fixedData
        this.dynamicData = dynamicData
        this.characterPosition = this.fixedData.spawnPoint

        if (fixedData.shape == 'capsule') {
            this.characterCollider = RAPIER.ColliderDesc.capsule(halfHeight,radius);
            this.charLine = createCapsuleLine(radius,fixedData.characterHeight-0.5)//this is an offset to make the hitbox visually accurate to its physics body height
        }else {
            this.characterCollider = RAPIER.ColliderDesc.cuboid(increasedHalfWidth,increasedHalfHeight,increasedHalfWidth);
            this.charLine = createBoxLine(increasedHalfWidth,increasedHalfHeight)
        }
        this.charLine.position.set(0,2.5,0.2)//these are artificial offsets to the hitbox relative to the character cuz the position can never be fully accurate on its own.so it needs this for it to be visually accurate
        if (Controller.showHitBoxes) this.character.add(this.charLine);

        this.characterBody.mass = this.fixedData.mass;
        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        this.characterColliderHandle = physicsWorld.createCollider(this.characterCollider,this.characterRigidBody).handle;
        this.characterRigidBody.setTranslation(this.characterPosition,true);

        this.groundDetectionDistance = halfHeight + 0.5 + ((fixedData.characterHeight%2) * 0.5);//i didnt just guess this from my head.i made the formula after trying different values and recording the ones that correctly matched a given character height,saw a pattern and crafted a formula for it
        this.originalHorizontalVel = dynamicData.horizontalVelocity;
        this.loadCharacterModel();
    }
    private loadCharacterModel():void {
        const loader:GLTFLoader = new GLTFLoader();
        loader.load(this.fixedData.modelPath,
            gltf=>{
                const characterModel = gltf.scene
                characterModel.position.z = this.modelZOffset
                this.character.add(characterModel);
                this.character.add(this.listener)
                this.mixer = new AnimationMixer(characterModel);
                this.loadCharacterAnimations(gltf);
                this.loadCharacterSounds();
                this.applyMaterialToModel(characterModel)
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
    private applyMaterialToModel(playerModel:THREE.Group<THREE.Object3DEventMap>) {
        playerModel.traverse((obj) => {//apply a metallic material
            if (!(obj instanceof THREE.Mesh)) return
            if (obj.material && obj.material.isMeshStandardMaterial) {
                obj.material.metalness = 0.5; 
                obj.material.roughness = 0.6;   
                obj.material.needsUpdate = true;
            }
        });
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
        const charPosY = Number(this.characterPosition.y.toFixed(2));//rounding it to exactly 2dp isnt just there to make reading the pos simpler but a necessity for the calculation to work
        const isRoundable = Math.round(charPosY) > charPosY;
        const posY = (isRoundable) ? Math.floor(charPosY) : charPosY-1;
        const groundPosY = posY - this.groundDetectionDistance;//the ground should be just a few cord lower than the player since te player stands over the ground
        console.log('Point Query| Player: ',charPosY);
        console.log("Point Query| is Roundable: ",isRoundable);
        console.log('Point Query| Pos: ',posY);
        console.log('Point Query| Final: ',groundPosY);
        return groundPosY
    }
    protected colorPoint(position:THREE.Vector3, color:number) {
        if (!Controller.showPoints) return;
        const geometry = new THREE.SphereGeometry(0.06,8,8); // Small sphere
        const material = new THREE.MeshBasicMaterial({ color: color });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position); // Set position
        point.position.y -= 0.5;
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
        console.log("Point Query| Ground?: ",onGround);
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
        const margin = 4; // tune as needed.its how far ahead do you want to detect obstacles in addition to the calculated dist which is usually below 1 cuz delta frames are usually fractions of a second
        this.obstacleDetectionDistance = (this.dynamicData.horizontalVelocity * delta) + margin
        console.log("Obstacle detection distance: ",this.obstacleDetectionDistance);
    }
    private getSteps(maxDistance:number,density:number) {
        let steps = Math.floor(maxDistance * density);
        const minSteps = 3;
        const maxSteps = 10;
        steps = Math.min(Math.max(steps, minSteps), maxSteps);
        return steps
    }

    private calcHeightTopDown(stepOverPos:THREE.Vector3,groundPosY:number) {
        console.log("STEPPING UP");
        this.shouldStepUp = true;
        const downwardCheckPos = stepOverPos.clone();//i cloned it to prevent subtle bugs if i reuse stepoverpos later
        for (let i=0;i <= this.dynamicData.maxStepUpHeight;i++) {
            let downwardClearance = true
            downwardCheckPos.sub(new THREE.Vector3(0,1,0));
            physicsWorld.intersectionsWithPoint(downwardCheckPos,()=>{
                const relativeHeight = Number((downwardCheckPos.y - groundPosY).toFixed(2));//to make the result more concise
                this.obstacleHeight = relativeHeight
                console.log("Relative height checked down: ",relativeHeight);
                downwardClearance = false
                return true
            })
            if (!downwardClearance) {
                break;
            }
        }   
    }
    private calcHeightBottomUp(stepOverPos:THREE.Vector3,groundPosY:number) {
        const upwardCheckPos = stepOverPos.clone();
        const maxHeightToCheck = 30
        for (let i=0;i <= maxHeightToCheck;i++) {
            let upwardClearance = true
            upwardCheckPos.add(new THREE.Vector3(0,1,0));
            physicsWorld.intersectionsWithPoint(upwardCheckPos,()=>{
                upwardClearance = false
                return true
            })
            if (upwardClearance) {
                const relativeHeight = Number((upwardCheckPos.y - groundPosY - 1).toFixed(2));//the -1 is a tested artificial deuction for accuracy when calculating the height upwards
                this.obstacleHeight = relativeHeight
                console.log("Relative height checked up: ",relativeHeight);
                break;
            }
        }   
    }
    private calcObstacleWidth(point: THREE.Vector3) {
        const horizontalForward = this.getHorizontalForward();
        const leftVector = new THREE.Vector3(horizontalForward.z, 0, -horizontalForward.x).normalize();

        const leftCheckPos = point.clone();
        const maxWidthToCheck = 30;
        for (let i=0;i <= maxWidthToCheck;i++) {
            let leftClearance = true
            leftCheckPos.add(leftVector);

            physicsWorld.intersectionsWithPoint(leftCheckPos,()=>{
                leftClearance = false
                return true
            })
            if (leftClearance) {
                const relativeWidth = Number(Math.sqrt(
                    Math.pow(leftCheckPos.x - point.x, 2) +
                    Math.pow(leftCheckPos.z - point.z, 2)
                ).toFixed(2));
                this.obstacleWidth = relativeWidth
                console.log("Relative width: ",relativeWidth);
                break;
            }
        }  
    }
    private detectObstacle():void {
        if (!this.isGrounded()) return;
        const forward = new THREE.Vector3(0,0,-1);
        const maxDistance = this.obstacleDetectionDistance;
        const steps = this.getSteps(maxDistance,this.pointDensity);

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
                if (!(shape instanceof RAPIER.Cuboid)) return true;//only detect cubes

                console.log('PointY Obstacle: ', point.y);
                hasCollided = true;

                const groundPosY = Math.max(0,this.calculateGroundPosition());//to clamp negative ground pos to 0 to prevent the relative height from being higher than the actual cube height when negative
                const stepOverPosY = (groundPosY+this.dynamicData.maxStepUpHeight) + 1//the +1 checks for the point just above this.is it possible to step over
                const stepOverPos = new THREE.Vector3(point.x,stepOverPosY,point.z)
                
                this.obstacleDistance = distance
                let clearance = true;
                physicsWorld.intersectionsWithPoint(stepOverPos, () => {
                    clearance = false
                    return false
                })
                if (clearance) {
                    this.calcHeightTopDown(stepOverPos,groundPosY)            
                }else {
                    this.calcHeightBottomUp(stepOverPos,groundPosY) ;
                    this.calcObstacleWidth(point) 
                }
                return true
            });    
        }
        if (!hasCollided) {
            this.obstacleDistance = Infinity//infinity distance means there are no obstacles
        }
    }
    //the calculations used in this function was derived from real physics rules since the whole of this is built on a physics engine
    //tune the reduction scale as needed
    private canJumpOntoObstacle() {//checks if the entity can jump on it based on the horizontal distance covered
        const reductionX = 15//im adding reduction scales to prevent inflation from high values.They are carefully tuned according to play feedback
        const reductionY = 6;

        const realisticGravity = 10
        const timeUp = this.dynamicData.jumpVelocity / realisticGravity;
        const totalTime = 2 * timeUp;

        const horizontalDistance = ((this.dynamicData.horizontalVelocity/reductionX)-(this.dynamicData.jumpResistance/reductionX)) * totalTime;
        const distanceX = Number(horizontalDistance.toFixed(2))

        const maxJumpHeight = ((this.dynamicData.jumpVelocity * timeUp) - (0.5 * realisticGravity * Math.pow(timeUp, 2)))/reductionY;
        const distanceY = Number(maxJumpHeight.toFixed(2))

        const canJumpDistanceX = (distanceX >= this.obstacleDistance);
        const canJumpDistanceY = (distanceY >= this.obstacleHeight);
        const canJump = (canJumpDistanceX && canJumpDistanceY);

        console.log('Entity Distance X:', distanceX);
        console.log('Entity Distance Y:', distanceY);
        console.log('Entity Distance Jump check:', distanceY);

        return canJump
    }
    private autoMoveForward() {
        this.stopWalkSound();
        const onGround = this.isGrounded()
        if (onGround) {
            console.log("Entity is walking");
            this.playWalkAnimation()
            this.playWalkSound();
        }
        if (this.canJumpOntoObstacle() && !this.shouldStepUp && onGround) {
            console.log("Entity is jumping");
            this.playJumpAnimation();
            this.moveCharacterUp();
        };
        this.moveCharacterForward();
        
        console.log("Entity Obstacle height: ",this.obstacleHeight);
        console.log("Entity Obstacle distance: ",this.obstacleDistance);
        console.log('Entity should step up: ',this.shouldStepUp);
    }
    // Helper method to get horizontal forward direction
    private getHorizontalForward(): THREE.Vector3 {
        const charDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.character.quaternion);
        return new THREE.Vector3(charDirection.x, 0, charDirection.z).normalize();
    }
    private distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    private roundToNearestTens(num:number):number {
        return Math.round(num / 10) * 10;
    }
    private isTargetClose = false;

    private branchedPath:THREE.Vector3 | null = null;
    protected moveToTarget(originalPath:THREE.Vector3) {//targetpos is the player for example
        const characterPos = this.character.position;
        const distToOriginalTarget = characterPos.distanceTo(originalPath);

        const currentPath = this.branchedPath || originalPath;
    
        const distThreshold = 5;
        const onGround = this.isGrounded()
        //this reads that the entity should walk around the obstacle if there is an obstacle,it cant walk forward,it has not reached close to the target and it knows for sure it cant jump,then it should walk around the obstacle
        const shouldWalkAroundObstacle = (this.obstacleDistance !== Infinity && (!this.shouldStepUp || !this.canWalkForward) && !this.isTargetClose && !this.canJumpOntoObstacle()) //either you cant step up or u cant walk forward
        console.log("Entity movement| obstacle height: ",this.obstacleHeight);
        console.log("Entity movement| obstacle distance: ",this.obstacleDistance);
        console.log("Entity movement| can move forward: ",this.canWalkForward);
        console.log("Entity movement| is target close: ",this.isTargetClose);
        console.log("Entity movement| canJump: ",this.canJumpOntoObstacle());
        console.log("Entity movement| shouldStepUp: ",this.shouldStepUp);
        console.log("Entity movement| isGrounded: ",onGround);
        console.log("Entity movement| should walk around obstacle: ",shouldWalkAroundObstacle);

        console.log("Entity path| pathTarget: ",currentPath);
        console.log("Entity path| prev path: ",this.branchedPath);

        console.log('Entity distToOldTarget:', distToOriginalTarget);
        if (this.branchedPath) {
            const distToBranchedPath = this.distanceXZ(characterPos, this.branchedPath);
            console.log('Entity distToPrevPath:', distToBranchedPath);
            if ((distToBranchedPath < distThreshold) || (distToOriginalTarget < this.roundToNearestTens(distToBranchedPath))) {
                this.branchedPath = null;
                console.log("Entity movement has reached destination");
            }
        }
        const detouredPath = currentPath.clone();
        if (shouldWalkAroundObstacle) { 
            console.log("Entity path| relative width: ",this.obstacleWidth);
            const horizontalForward = this.getHorizontalForward();
            const leftVector = new THREE.Vector3(horizontalForward.z, 0, -horizontalForward.x).normalize();//Swapping x and z and negating x gives you the left-facing perpendicular vector in the XZ plane.
            const lateralOffset = leftVector.clone().multiplyScalar(Math.max(1,this.obstacleWidth));  // Left shift
            detouredPath.add(lateralOffset);
            this.branchedPath = detouredPath;
        }
        console.log("Entity path| newPathTarget: ",detouredPath);
        // this.colorPoint(pathTargetPos,0x000000)

        
        const direction = detouredPath.clone().sub(characterPos);
        const charDirection = new THREE.Vector3(0,0,-1).applyQuaternion(this.character.quaternion)
        const angleDiff = Math.atan2(charDirection.x,charDirection.z) - Math.atan2(direction.x,direction.z);
        const normAngle = (angleDiff + (2*Math.PI)) % (2 * Math.PI) ;//we normalized the angle cuz its measured in radians not degrees
        const normAngleInDegrees = Number((normAngle * (180/Math.PI)).toFixed(2))
        const rotationThreshold = 10;//the magnitude of the rotation diff before it rotates to the target direction

        const distToTarget = characterPos.distanceTo(detouredPath);
        this.isTargetClose = distToTarget < distThreshold;

        if ((normAngleInDegrees > rotationThreshold)) {
            console.log("Passed rotation threshols");
            if (normAngleInDegrees < 180) {
                this.rotateCharacterX('right')
            }else {
                this.rotateCharacterX('left')
            }
        }
        if (!this.isTargetClose) {
            this.autoMoveForward();
        }else {
            this.playIdleAnimation()
            this.stopWalkSound();
        }
        console.log("Entity path| currentPos: ",characterPos);
    }

    private canWalkForward:boolean = false
    private checkIfCanWalkForward(prevCharPosition:THREE.Vector3) {//defense mechanism to catch failures of shouldStepUp cuz of faulty collision detection
        if (Math.abs(this.velocity.z) > 0 && !this.shouldStepUp) {//this checks if i moved forward but it doesnt check if i should step up cuz if it can step up,then it can walk forward
            const ifComponentY = (Math.abs(this.velocity.y) > 0)
            const posDiff = prevCharPosition.distanceTo(this.characterRigidBody.translation());
            const readablePosDiff = Number(posDiff.toFixed(2));
            const diffThreshold = (ifComponentY) ? 0.5 : 0.15//this was made based on observation.when the char jumps,the thresh needs to be higher cuz the extra y comp means that the diff will be bigger 
            if (readablePosDiff < diffThreshold) {
                this.canWalkForward = false;
            }else {
                this.canWalkForward = true;
            }
            console.log("Can walk forward| pos diff: ",readablePosDiff);
            console.log("Can walk forward| diff thresh: ",diffThreshold);
            console.log("Can walk forward| boolean: ",this.canWalkForward);
        }
    }
    private applyVelocity():void {  //i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
        const prevCharPosition = new THREE.Vector3(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z);
        console.log('Character| prevCharPosition:', prevCharPosition);
        if (this.isGrounded() || this.shouldStepUp) {
            this.characterRigidBody.setLinvel(this.velocity,true);
            this.checkIfCanWalkForward(prevCharPosition)
        };
        this.characterPosition = this.characterRigidBody.translation();
    }
    private resetVariables():void {
        this.velocity.set(0,0,0);//to prevent accumulaion over time
        this.dynamicData.horizontalVelocity = this.originalHorizontalVel;//the horizontal velocity is subject to runtime mutations so i have to reset it
        this.shouldStepUp = false;
        // this.obstacleHeight = 0;
        this.obstacleDistance = 0;
        this.obstacleWidth = 0;
    }
    private updateCharacterAnimations():void {
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
    }
    private updateCharacterTransformations():void {
        //i minused it from ground detction distance to get it to stay exactly on the ground
        const [posX,posY,posZ] = [this.characterPosition.x,this.characterPosition.y-this.groundDetectionDistance-0.5,this.characterPosition.z];
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


    protected wakeUpBody() {
        if ( this.characterRigidBody.isSleeping()) this.characterRigidBody.wakeUp();
    }
    protected moveCharacterForward():void {
        this.wakeUpBody();
        if (this.shouldStepUp) this.moveOverObstacle();
        else this.moveForward(this.dynamicData.horizontalVelocity);
    }
    protected moveCharacterBackward():void {
        this.wakeUpBody()
        const backward = new THREE.Vector3(0,0,this.dynamicData.horizontalVelocity);
        backward.applyQuaternion(this.character.quaternion);
        this.velocity.add(backward);
        this.forceCharacterDown();
    }
    protected moveCharacterLeft():void {
        this.wakeUpBody()
        const left = new THREE.Vector3(-this.dynamicData.horizontalVelocity,0,0);
        left.applyQuaternion(this.character.quaternion);
        this.velocity.add(left);
        this.forceCharacterDown();
    }
    protected moveCharacterRight():void {
        this.wakeUpBody()
        const right = new THREE.Vector3(this.dynamicData.horizontalVelocity,0,0);
        right.applyQuaternion(this.character.quaternion);
        this.velocity.add(right);
        this.forceCharacterDown();
    }
    protected moveCharacterUp(velocityDelta?:number):void {
        this.wakeUpBody();
        const up = new THREE.Vector3(0,velocityDelta || this.dynamicData.jumpVelocity,0);
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
    protected rotateCharacterX(direction:'left' | 'right'):void {
        const sign = (direction=="right")? 1 : -1
        this.wakeUpBody();
        this.targetRotation.y -= (this.dynamicData.rotationDelta * sign); 
        this.targetQuaternion.setFromEuler(this.targetRotation);
    }


    protected isAirBorne():boolean {
        const onGround = this.isGrounded() ;
        console.log("Airborne| on ground: ",onGround);
        return !onGround && this.shouldPlayJumpAnimation && !this.shouldStepUp
    }
    protected playJumpAnimation():void {
        if (this.mixer && this.jumpAction) this.fadeToAnimation(this.jumpAction);
    }
    protected playWalkAnimation():void {
        if (this.mixer && this.walkAction) this.fadeToAnimation(this.walkAction);
    }
    protected playIdleAnimation():void {
        if (this.mixer && this.idleAction) this.fadeToAnimation(this.idleAction);
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

    
    get updateController():() => void {
        return this.updateCharacter
    }
    get controller():THREE.Group {
        scene.add(this.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created
        return this.character
    }
    get position():THREE.Vector3 {
        return new THREE.Vector3(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z)
    }



    private forceSleepIfIdle() {
        if (this.isGrounded() && !this.characterRigidBody.isSleeping()) {// im forcing the character rigid body to sleep when its on the ground to prevent extra computation for the physics engine and to prevent the character from consistently querying the engine for ground or obstacle checks.doing it when the entity is grounded is the best point for this.but if the character is on the ground but he wants to move.so what i did was that every exposed method to the inheriting class that requires modification to the rigid body will forcefully wake it up before proceeding.i dont have to wake up the rigid body in other exposed functions that dont affect the rigid body.and i cant wake up the rigid body constantly at a point in the update loop even where calculations arent necessary cuz the time of sleep may be too short.so by doing it the way i did,i ensure that the rigid body sleeps only when its idle. i.e not updated by the inheriting class.this means that the player body isnt simulated till i move it or jump.
            this.characterRigidBody.sleep();
        } 
    }
    protected abstract onLoop():void//this is a hook where the entity must be controlled before updating
     //in this controller,order of operations and how they are performed are very sensitive to its accuracy.so the placement of these commands in the update loop were crafted with care.be cautious when changing it in the future.but the inheriting classes dont need to think about the order they perform operations on their respective controllers cuz their functions that operate on the controller are hooked properly into the controller's update loop and actual modifications happens in the controller under a crafted environment not in the inheriting class code.so it meands that however in which order they write the behaviour of their controllers,it will always yield the same results
    private updateCharacter():void {//i made it private to prevent direct access but added a getter to ensure that it can be read essentially making this function call-only
        this.forceSleepIfIdle();
        this.onLoop();
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
            this.detectObstacle();
            this.respawnIfOutOfBounds();
        }
    }
}