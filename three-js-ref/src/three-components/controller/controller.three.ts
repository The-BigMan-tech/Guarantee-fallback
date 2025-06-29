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
    private widthDebuf:number

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

        this.widthDebuf = fixedData.characterWidth - 1;
        this.groundDetectionDistance = halfHeight + 0.5 + ((fixedData.characterHeight%2) * 0.5);//i didnt just guess this from my head.i made the formula after trying different values and recording the ones that correctly matched a given character height,saw a pattern and crafted a formula for it

        this.originalHorizontalVel = dynamicData.horizontalVelocity;
        this.loadCharacterModel();
    }
    private calculateGroundPosition() {
        const initGroundPosY = Number((this.characterPosition.y - this.groundDetectionDistance).toFixed(2)) - 1;
        const finalGroundPosY = Number((initGroundPosY - this.widthDebuf).toFixed(1))
        console.log('groundPosY:',finalGroundPosY);
        return finalGroundPosY
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
        const destinationHeight = this.obstacleHeight; // no need to round here
        const upwardVelocity = Math.sqrt(2 * gravityY * destinationHeight);
        console.log("Final upward velocity: ",upwardVelocity);
        return upwardVelocity
    }
    private calculateForwardVelocity(upwardVelocity:number):number {
        const totalAirTime = (2 * upwardVelocity) / gravityY;
        const forwardVelocity = Math.ceil(this.obstacleDetectionDistance / totalAirTime) + 1;
        console.log("Final forward velocity: ",forwardVelocity);
        return forwardVelocity
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
        this.colorPoint(point,0xffffff)
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
            Math.max(0,this.calculateGroundPosition()) + 1,//to clamp negative ground pos to 0 to prevent the relative height from being higher than the actual cube height when negative
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
                const relativeHeight = Number((downwardCheckPos.y - groundPosY + 1).toFixed(2));//to make the result more concise
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
    private obstacleClearancePoint:THREE.Vector3 = new THREE.Vector3();
    private calcClearanceForAgent(point: THREE.Vector3,overshoot:number) {
        const horizontalForward = this.getHorizontalForward();
        const leftVector = new THREE.Vector3(horizontalForward.z, 0, -horizontalForward.x).normalize();

        const leftCheckPos = point.clone();
        const maxWidthToCheck = 30;

        let firstColliderHandle:number | null = null;
        let overshotCollider:boolean = false;

        for (let i=0;i <= maxWidthToCheck;i++) {
            let leftClearance = true
            leftCheckPos.add(leftVector);

            physicsWorld.intersectionsWithPoint(leftCheckPos,(colliderObject)=>{
                if (!firstColliderHandle) {
                    firstColliderHandle = colliderObject.handle;
                }
                if (colliderObject.handle !== firstColliderHandle) {
                    leftClearance = true
                    overshotCollider = true
                }else {
                    leftClearance = false
                }
                return true
            })
            if (leftClearance) {
                const forward = this.getHorizontalForward();
                let finalPos: THREE.Vector3;
                if (overshotCollider) {
                    const backOffDistance = 5; // tune this value as needed
                    const backOffPos = leftCheckPos.clone().add(leftVector.clone().multiplyScalar(-backOffDistance));
                    finalPos = backOffPos.clone().add(forward.multiplyScalar(overshoot));
                    console.log('Overshot the collider');
                }else {
                    finalPos = leftCheckPos.clone().add(forward.multiplyScalar(overshoot));
                }
                this.obstacleClearancePoint = finalPos
                console.log('charcter clearance point:', this.obstacleClearancePoint);
                break;
            }
        }  
    }
    private detectObstacle():void {
        if (!this.isGrounded()) return;//to prevent detection when in the air

        const forward = new THREE.Vector3(0,0,-1);
        const maxDistance = this.obstacleDetectionDistance;
        const steps = this.getSteps(maxDistance,this.pointDensity);

        const horizontalForward = this.getHorizontalForward();
        const right = new THREE.Vector3(-horizontalForward.z, 0, horizontalForward.x).normalize();
        

        let hasCollidedForward = false
        for (let i = 1; i <= steps; i++) {
            if (hasCollidedForward) break;
            const distance = (maxDistance / steps) * i;
            let point:THREE.Vector3 = this.orientPoint(distance,forward);
            const middlePoint = Math.ceil(steps/2);

            //overshoot the middle and foremost point to the right for a better opportunity to properly calculate the clearance point for the agent.the reason why its to the right is because when you turn left to a wall,its your right that faces the wall
            if (i == steps) {//im overshooting the foremost one cuz its requires for that intial turn but because it slides off almost immediately cuz of agent movement,it doesnt properly calculate the clearance
                point = point.add(right.clone().multiplyScalar(2));
            }else if (i == middlePoint) {//im overshooting the middle point cuz even when the agent quickly turns,the one in the middle doesnt slide off cuz its closer to the agent itself not too ahead of it
                point = point.add(right.clone().multiplyScalar(1));//i noticed from gameplay that this should have a smaller offset than the foremosy one 
            }

            this.colorPoint(point,0x000000);
            physicsWorld.intersectionsWithPoint(point, (colliderObject) => {
                const collider = physicsWorld.getCollider(colliderObject.handle);
                const shape = collider.shape
                console.log('PointY Obstacle: ', point.y);
                console.log('Obstacle Collider shape:', shape);
                if (!(shape instanceof RAPIER.Cuboid)) return true;//only detect cubes

                console.log('PointY Obstacle: ', point.y);
                hasCollidedForward = true;

                const groundPosY = point.y
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
                    this.calcHeightBottomUp(stepOverPos,groundPosY);
                    if ((i == middlePoint) || (i == steps)) this.calcClearanceForAgent(point,6);
                }
                return true
            });    
        }
        if (!hasCollidedForward) {
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
    private getSteeringDirection(path:THREE.Vector3):'right' | 'left' | null {
        const direction = path.clone().sub(this.character.position);
        const charDirection = new THREE.Vector3(0,0,-1).applyQuaternion(this.character.quaternion)
        const angleDiff = Math.atan2(charDirection.x,charDirection.z) - Math.atan2(direction.x,direction.z);
        const normAngle = (angleDiff + (2*Math.PI)) % (2 * Math.PI) ;//we normalized the angle cuz its measured in radians not degrees
        const normAngleInDegrees = Number((normAngle * (180/Math.PI)).toFixed(2));
        const rotationThreshold = 10;//the magnitude of the rotation diff before it rotates to the target direction
        if (normAngleInDegrees > rotationThreshold) {
            return (normAngleInDegrees < 180)?'right':'left'
        }
        return null
    }
    private isTargetClose = false;
    private branchedPath:THREE.Vector3 | null = null;

    protected moveToTarget(originalPath:THREE.Vector3) {//targetpos is the player for example
        const currentPath = this.branchedPath || originalPath;
        const characterPos = this.character.position;
        const distToOriginalTarget = this.distanceXZ(characterPos,originalPath)
        //this reads that the entity should walk around the obstacle if there is an obstacle,it cant walk forward,it has not reached close to the target and it knows for sure it cant jump,then it should walk around the obstacle

        const shouldWalkAroundObstacle = (
            this.obstacleDistance !== Infinity && 
            !this.isTargetClose && 
            !this.canJumpOntoObstacle() &&
            (!this.shouldStepUp || !this.canWalkForward) 
        ) //either you cant step up or u cant walk forward

        console.log("Entity movement| should walk around obstacle: ",shouldWalkAroundObstacle);

        console.log("Entity path| branched path: ",this.branchedPath);
        console.log("Entity path| original path: ",originalPath);
        console.log("Entity path| compare char pos: ",characterPos);

        console.log('Entity distToOriginalTarget:', distToOriginalTarget);

        let distThreshold = 5;//this is to tell the algorithm how close to the target the character should be to be considered its close to the target or far from the target.
        if (this.branchedPath) {
            const distToBranchedPath = this.distanceXZ(characterPos, this.branchedPath);
            console.log('Entity distToBranchedPath:', distToBranchedPath);
            //this is if it has reached the branched path
            if ((distToBranchedPath < distThreshold) || (distToOriginalTarget < this.roundToNearestTens(distToBranchedPath))) {
                this.branchedPath = null;
                console.log('Cleared this branch');
                return;//return from this branch cuz if i dont,the character will proceed to walk towards this branch which it has already done during the last detour.although,the code still works if i dont return here but i believe it will jitter if i dont put this
            }
        }
        const detouredPath = currentPath.clone();
        if (shouldWalkAroundObstacle && !(this.obstacleClearancePoint.equals({x:0,y:0,z:0}))) { 
            detouredPath.copy(this.obstacleClearancePoint);
            console.log('Entity path| compare detouredPath:',this.obstacleClearancePoint);
            this.branchedPath = detouredPath;
        }
        // this.colorPoint(pathTargetPos,0x000000)
        const finalDir = this.getSteeringDirection(detouredPath)
        const distToFinalDest = characterPos.distanceTo(detouredPath)
        const epsilon = 0.01;

        if (currentPath.distanceTo(detouredPath) > epsilon) {//means they are different
            distThreshold = 0.1//by making the threshold for closeness tight,im making it easy for the algo to see this a far so that it can walk towards it cuz the dist diff on the intial obstacle turn is too short
        }
        this.isTargetClose = distToFinalDest < distThreshold;
        if (finalDir !== null) {
            console.log("Passed rotation threshols");
            this.rotateCharacterX(finalDir);
        }else {
            if (!this.isTargetClose) {
                this.autoMoveForward();
            }else {
                this.playIdleAnimation();
                this.stopWalkSound();
            }
        }
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
        this.obstacleDistance = 0;
         // this.obstacleHeight = 0;
    }
    private updateCharacterAnimations():void {
        const delta = this.clock.getDelta();
        if (this.mixer) this.mixer.update(delta);
    }
    private updateCharacterTransformations():void {
        //i minused it from ground detction distance to get it to stay exactly on the ground
        const [posX,posY,posZ] = [this.characterPosition.x,this.calculateGroundPosition()+0.5,this.characterPosition.z];
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