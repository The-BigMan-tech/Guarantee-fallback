import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY, combatCooldown} from "../physics-world.three";
import { walkSound,punchSound,landSound } from "../listener/listener.three";

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
type degrees = number;
type seconds = number;
//*The ground position calculation may break for an arbritary charcter height.a stable and tested height is 2. 1,3 and 4 have been played tested and are smooth but the ground check jitters a little between false and true cuz jumping from the ground at times at these values feels uresponsive
//i made it an abstract class to prevent it from being directly instantiated to hide internals,ensure that any entity made from this has some behaviour attatched to it not just movement code and to expose a simple innterface to update the character through a hook that cant be passed to the constrcutor because it uses the this binding context.another benefit of using the hook is that it creates a consistent interface for updating all characters since a common function calls these abstract hooks
export abstract class Controller {
    private static readonly showHitBoxes = false;//the hitboxes are a bit broken
    private static readonly showPoints = true;

    protected dynamicData:DynamicControllerData;//needs to be protected so that the class methods can change its parameters like speed dynamically but not public to ensure that there is a single source of truth for these updates
    private fixedData:FixedControllerData;//this is private cuz the data here cant or shouldnt be changed after the time of creation for stability
    
    private character: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();//made it private to prevent mutation but added a getter for it to be added to the scene
    private characterBody: RAPIER.RigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    private characterPosition:RAPIER.Vector3
    private characterCollider: RAPIER.ColliderDesc
    protected characterRigidBody:RAPIER.RigidBody | null;//im only exposing this for cleanup purposes
    private readonly characterColliderHandle:number;
    private charLine: THREE.LineSegments;

    private readonly modelZOffset:number = 0.3;//this is to offset the model backwards a little from the actual character position so that the legs can be seen in first person properly without having to move the camera

    private obstacleHeight: number = 0;//0 means there is no obstacle infront of the player,a nmber above this means there is an obstacle but the character can walk over it,infinty means that tere is an obstacle and the character cant walk over it
    private obstacleDetectionDistance:number = 0;
    private groundDetectionDistance:number;
    
    private velocity:THREE.Vector3 = new THREE.Vector3(0,0,0);
    private targetRotation:THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private targetQuaternion:THREE.Quaternion = new THREE.Quaternion();


    private playLandSound: boolean = true;
    
    protected clockDelta:number | null = null;
    protected mixer: THREE.AnimationMixer | null = null;//im only exposing this for cleanup purposes
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private walkAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;
    private attackAction:THREE.AnimationAction | null = null;
    private deathAction:THREE.AnimationAction | null = null;

    private shouldStepUp: boolean = false;
    private shouldPlayJumpAnimation: boolean = false;

    private originalHorizontalVel:number
    public points:THREE.Object3D = new THREE.Object3D();
    private readonly pointDensity = 1.5;

    private obstacleDistance:number = 0;//unlike obstacledetection distance which is a fixed unit telling the contoller how far to detect obstacles ahead of time,this one actually tells the realtime distance of an obstacle form the controller
    private widthDebuf:number
    private obstacleClearancePoint:THREE.Vector3 = new THREE.Vector3();

    private isFinalDestClose = false;
    private branchedPath:THREE.Vector3 | null = null;

    private canWalkForward:boolean = false;
    protected isOutOfBounds:boolean = false;

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
            this.charLine = createCapsuleLine(radius,fixedData.characterHeight)//this is an offset to make the hitbox visually accurate to its physics body height
        }else {
            this.characterCollider = RAPIER.ColliderDesc.cuboid(increasedHalfWidth,increasedHalfHeight,increasedHalfWidth);
            this.charLine = createBoxLine(increasedHalfWidth,increasedHalfHeight)
        }

        this.characterBody.mass = this.fixedData.mass;
        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        this.characterColliderHandle = physicsWorld.createCollider(this.characterCollider,this.characterRigidBody).handle;
        this.characterRigidBody.setTranslation(this.characterPosition,true);

        this.widthDebuf = fixedData.characterWidth - 1;
        this.groundDetectionDistance = halfHeight + 0.5 + ((fixedData.characterHeight%2) * 0.5);//i didnt just guess this from my head.i made the formula after trying different values and recording the ones that correctly matched a given character height,saw a pattern and crafted a formula for it

        this.originalHorizontalVel = dynamicData.horizontalVelocity;

        this.charLine.position.set(0,fixedData.characterHeight + 1,this.modelZOffset)//these are artificial offsets to the hitbox relative to the character cuz the position can never be fully accurate on its own.so it needs this for it to be visually accurate
        if (Controller.showHitBoxes) this.character.add(this.charLine);

        this.loadCharacterModel();
    }
    private calculateGroundPosition() {
        const initGroundPosY = Number((this.characterPosition.y - this.groundDetectionDistance).toFixed(2)) - 1;//the choice of to fixed(2) and -1 decrement was gotten from observations where i used a ground position point that worked at a particular place as a ref point and used that to correct my calculation through an iterative process of performing the right arithmetic
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
                this.mixer = new AnimationMixer(characterModel);
                this.loadCharacterAnimations(gltf);
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
        const attackClip = THREE.AnimationClip.findByName(gltf.animations, 'attack'); 
        const deathClip = THREE.AnimationClip.findByName(gltf.animations, 'death'); 
    
        if (walkClip) this.walkAction = this.mixer.clipAction(walkClip);
        if (jumpClip) this.jumpAction = this.mixer.clipAction(jumpClip);
        if (attackClip) {
            this.attackAction = this.mixer.clipAction(attackClip);
            this.attackAction.setLoop(THREE.LoopOnce, 1);
            this.attackAction.clampWhenFinished = true;
        }
        if (deathClip) {
            this.deathAction = this.mixer.clipAction(deathClip);
            this.deathAction.setLoop(THREE.LoopOnce, 1);
            this.deathAction.clampWhenFinished = true;
        }
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
                obj.material.metalness = 0; 
                obj.material.roughness = 0.6;   
                obj.material.needsUpdate = true;
            }
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
        const upwardVelocity = Math.ceil(Math.sqrt(2 * gravityY * destinationHeight));//i used ceiling here for that extra velocity boost to be sure enough that it can be used to overcome the obstacle
        console.log("Final upward velocity: ",upwardVelocity);
        return upwardVelocity
    }
    private calculateForwardVelocity(upwardVelocity:number):number {
        const totalAirTime = (2 * upwardVelocity) / gravityY;
        const forwardVelocity = Math.ceil(this.obstacleDetectionDistance / totalAirTime);//i used ceil here for the same reason why i used it it for upward velocity
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
        if (!this.characterRigidBody) return false;
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
                landSound.play();
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
        if (!this.characterRigidBody) return Controller.zeroVector;
        const rotation = this.characterRigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const dir = directionVector.clone().applyQuaternion(quat).normalize();
    
        const point = new THREE.Vector3(
            this.characterPosition.x + (dir.x * distance),
            this.calculateGroundPosition() + 1,//The +1 is a required inflation to prevent the point from sinking to the ground as shown in my visual debugger.if it sinks,it will make a point query every frame which will severly lag the game.the actual place where this +1 came from is because calc ground position sinks the point by doing -1 which is for precision concerning checking for the ground but not in the context of detecting obstacles.
            this.characterPosition.z + (dir.z * distance)
        );
        return point
    }
    //todo:make the margin to be equal the jump distance.
    private updateObstacleDetectionDistance() {
        const delta = this.clockDelta || 0;
        //*Be cautious when changing this margin.it has to be smaller or equal to the distance that the entity can jump or else,it will never jump
        const margin = 3; // tune as needed.its how far ahead do you want to detect obstacles in addition to the calculated dist which is usually below 1 cuz delta frames are usually fractions of a second
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

    private calcHeightTopDown(stepOverPos:THREE.Vector3) {
        const downwardCheckPos = stepOverPos.clone();//i cloned it to prevent subtle bugs if i reuse stepoverpos later
        const increment = 0.1;//the reason why i used a float this precise for the increment is to improve its robustness.this is because the blocks i generated in my world had random heights between x to y but not in whole integers but in floats.so when i used 1 here as the increment,it led to a subtle bug where the height was calculated as 2 but in reality,it was actually 2.2 leading to false positives that made the controller to attempt to step over the obstacle using a calculated upward and forward velocity that wasnt the actucal required velocity to overcome the obstacle and it wasnt suppose to walk over it in te first place which also led to a bug where calc clearance for agent was never called so my entity got stuck
        for (let i=0;i <= this.dynamicData.maxStepUpHeight;i+=increment) {
            let downwardClearance = true
            downwardCheckPos.sub(new THREE.Vector3(0,increment,0));

            physicsWorld.intersectionsWithPoint(downwardCheckPos,()=>{//since stepOverPos is already calculated relative to the ground position,i dont have to involve it when calculating relative height
                const relativeHeight = Number(downwardCheckPos.y.toFixed(2));//i fixed it to 2dp to make the result more concise.the +1 is an artificial inflation for accuracy
                this.obstacleHeight = relativeHeight
                downwardClearance = false
                console.log("Relative height checked down: ",relativeHeight);
                if (relativeHeight <= this.dynamicData.maxStepUpHeight) {//despite that this method should be guaranteed to only be called if there is clearance at the point step over pos,i still added this because of a scenario where it was falsely called so ever since,its safer to have this here as a defensive check
                    console.log("STEPPING UP");
                    this.shouldStepUp = true;
                }
                return true
            })
            if (!downwardClearance) {
                break;
            }
        }   
    }
    private calcHeightBottomUp(stepOverPos:THREE.Vector3) {
        const upwardCheckPos = stepOverPos.clone();
        const maxHeightToCheck = 30;
        const increment = 0.1;//the reason why the increment is in float is for the same reason it is for calc height top down

        for (let i=0;i <= maxHeightToCheck;i+=increment) {
            let upwardClearance = true
            upwardCheckPos.add(new THREE.Vector3(0,increment,0));
            physicsWorld.intersectionsWithPoint(upwardCheckPos,()=>{
                upwardClearance = false
                return true
            })
            if (upwardClearance) {
                const relativeHeight = Number(upwardCheckPos.y.toFixed(2));//the relative height here is actually 0.1 more than its actually supposed to be.since its a minor precision error,i can ignore it.i dont think its possible to get exact precision.i can add a decrement of 0.1 here but it will decrease clarity and increase the number of precision parts of the code i have to track.
                this.obstacleHeight = relativeHeight
                console.log("Relative height checked up: ",relativeHeight);
                break;
            }
        }   
    }
    private prioritizeBranch:boolean = false;

    private calcClearanceForAgent(point: THREE.Vector3,purpose:'foremostRay' | 'sideRay') {
        const horizontalForward = this.getHorizontalForward();
        const maxWidthToCheck = 40;
        const reachedPreviousClearance = this.obstacleClearancePoint.equals({x:0,y:0,z:0})//it only clears when the entity has reached the previous branch
        
        console.log('reachedPreviousClearance:', reachedPreviousClearance);
        
        if ((purpose == 'sideRay') && reachedPreviousClearance) {//only the side or foremost ray can be called at a time per call.but the side ray is guaranteed to be called before the foremist ray becuase the detcetion loop starts from the first point to the foremost one
            const straightLinePos = point.clone();//i termed this straight line cuz it penetrates through blocks to get a clearance point
            let finalPos: THREE.Vector3 | null = null;
            for (let i=0;i <= maxWidthToCheck;i++) {
                let straightClearance = true
                this.colorPoint(straightLinePos,0x033e2b)
                straightLinePos.add(horizontalForward);

                physicsWorld.intersectionsWithPoint(straightLinePos,(colliderObject)=>{
                    const shape = physicsWorld.getCollider(colliderObject.handle).shape
                    const isCharacterCollider = colliderObject.handle == this.characterColliderHandle;
                    if (isCharacterCollider || !(shape instanceof RAPIER.Cuboid)) return true;
                    straightClearance = false
                    return true
                })
                if (straightClearance) {
                    finalPos = straightLinePos.clone().add(horizontalForward.clone().multiplyScalar(6));
                    this.obstacleClearancePoint = finalPos;
                    this.prioritizeBranch = false
                    this.colorPoint(finalPos,0x34053e);
                    console.log('character clearance point:', this.obstacleClearancePoint);
                    break;
                }
            }  
        }
        if (purpose == "foremostRay") {
            const horizontalBackward = horizontalForward.clone().negate();
            const direction = this.useClockwiseScan ? horizontalForward : horizontalBackward;
            const rayLinePos = point.clone();//i termed this ray even though its just shooting points because it behaves like one cuz when it hits an obstacle,it casts a new point at 180 to where the point hit rather than penetrating through the block like the one form the side ray
            
            let rayBlocked = false;
            this.colorPoint(rayLinePos,0x290202)

            physicsWorld.intersectionsWithPoint(rayLinePos,(colliderObject)=>{ 
                const shape = physicsWorld.getCollider(colliderObject.handle).shape 
                const isCharacterCollider = colliderObject.handle == this.characterColliderHandle;
                if (isCharacterCollider || !(shape instanceof RAPIER.Cuboid)) return true;
                rayBlocked = true;
                return true;
            })
            if (rayBlocked)  {
                const sideVector = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
                const nudgePoint = rayLinePos.clone().add(sideVector.multiplyScalar(4));
                this.colorPoint(nudgePoint,0x19044c)
                this.obstacleClearancePoint = nudgePoint;
                this.prioritizeBranch = true
                console.log('Adjusted clearance point:', this.obstacleClearancePoint);
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
        const left = right.clone().negate();

        let hasCollidedForward = false;

        for (let i = 1; i <= steps; i++) {
            const distance = (maxDistance / steps) * i;
            const point:THREE.Vector3 = this.orientPoint(distance,forward);

            const firstPoint = 1;
            const foremostPoint = steps;

            let offsetPoint:THREE.Vector3 = point.clone();

            let purpose:'foremostRay' | 'sideRay' = 'foremostRay'
            if ((i == firstPoint)) {
                const sideOffset = this.useClockwiseScan ? right : left
                offsetPoint = offsetPoint.add(sideOffset.clone().multiplyScalar(3));
                purpose = 'sideRay'
            }
            this.colorPoint(offsetPoint,0x000000);
            physicsWorld.intersectionsWithPoint(offsetPoint, (colliderObject) => {
                const shape = physicsWorld.getCollider(colliderObject.handle).shape
                const isCharacterCollider = colliderObject.handle == this.characterColliderHandle;
                if (isCharacterCollider || !(shape instanceof RAPIER.Cuboid)) return true;//avoid the character own collider and any other collier that isnt a cuboid cuz im using capsule for entities and the player and i dont want false positives

                console.log('PointY Obstacle: ', offsetPoint.y);
                hasCollidedForward = true;

                const groundPosY = offsetPoint.y;
                console.log('relative groundPosY:', groundPosY);
                const stepOverPosY = (groundPosY + this.dynamicData.maxStepUpHeight)-0.5//logically,to check for if i can step over an obstacle of a given height using a clearance check,then i should raise this point by at least +1 so that it doesnt give false negatives that i cant step over it but that +1 has already been added when i called orient point.check why i added the +1 there through the comments for that method.and why i later did -0.5 was because of precision.leaving the value as it is can make the point higher in precision that it actually should be.after testing with blocks generated with float heights.i realized that this float deduction was necessary to appropriately know if the character can step over the obstacle or not
                const stepOverPos = new THREE.Vector3(offsetPoint.x,stepOverPosY,offsetPoint.z)
                
                this.colorPoint(stepOverPos,0x022131);

                this.obstacleDistance = distance
                console.log('this obstacleDistance:', this.obstacleDistance);

                let clearance = true;
                physicsWorld.intersectionsWithPoint(stepOverPos, () => {
                    clearance = false
                    return false
                })
                if (clearance) {
                    this.calcHeightTopDown(stepOverPos)            
                }else {//we want to get the clearance point for the agent only when it cant step over it which occurs when it has to check for the obstacle height bottom up rather than top down cuz it will lead to unnecessar calc and cost perf if we do this in every frame even when we dont need it
                    this.calcHeightBottomUp(stepOverPos);
                    if ((i == foremostPoint) || (i == firstPoint)) this.calcClearanceForAgent(offsetPoint,purpose);
                }
                return true
            });    
        }
        if (!hasCollidedForward) {
            this.obstacleDistance = Infinity//infinity distance means there are no obstacles
        }
        this.checkForGroundAhead(steps+1,forward)
    }

    private groundIsPresentForward:boolean = false;
    private checkForGroundAhead(distance:number,forward:THREE.Vector3) {
        const aheadGroundDetPoint:THREE.Vector3 = this.orientPoint(distance,forward);
        aheadGroundDetPoint.y = this.calculateGroundPosition();
        this.colorPoint(aheadGroundDetPoint,0x3e2503);  

        physicsWorld.intersectionsWithPoint(aheadGroundDetPoint, (colliderObject) => {
            const shape = physicsWorld.getCollider(colliderObject.handle).shape
            const isCharacterCollider = colliderObject.handle == this.characterColliderHandle;
            if (isCharacterCollider || !(shape instanceof RAPIER.Cuboid)) return true;
            this.groundIsPresentForward = true;
            return false;
        })
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
        const distanceX = Math.ceil(horizontalDistance);//i used ceiling to get a single integer and to make it considerate enough than using decimal places or rounding.but dont artificially inflate this or it will lead to false positive where it thinks it can jump but it cant and it will just get stuck in a loop trying to

        const maxJumpHeight = ((this.dynamicData.jumpVelocity * timeUp) - (0.5 * realisticGravity * Math.pow(timeUp, 2)))/reductionY;
        const distanceY = Math.ceil(maxJumpHeight);

        const canJumpDistanceX = (distanceX >= this.obstacleDistance);
        const canJumpDistanceY = (distanceY >= this.obstacleHeight);
        const canJump = (canJumpDistanceX && canJumpDistanceY);

        console.log('Jump. obstacleDistance:', this.obstacleDistance);
        console.log('Jump. obstacleHeight', this.obstacleHeight);

        console.log('Entity Distance X:', distanceX);
        console.log('Entity Distance Y:', distanceY);

        return canJump
    }
    private autoMoveForward(finalDestY:number) {
        this.stopWalkSound();
        const onGround = this.isGrounded();

        const greaterOrSameYLevel = Math.round(finalDestY - this.character.position.y) >= 2;//this is to ensure it doesnt jumps proactively when im below it.it should just walk down
        const jumpProactively = greaterOrSameYLevel && !this.groundIsPresentForward;
        
        console.log("jump proactively. y diff: ", (finalDestY - this.character.position.y));
        console.log('.*jump proactively. groundIsNotPresentForward: ',!this.groundIsPresentForward);
        console.log('.*jump proactively. greaterOrSameYLevel: ',greaterOrSameYLevel);

        if (this.isNearOriginalPath) {//this is for it to retain spacing between the entity and the target so that it doesnt jitter between moving and staying idle because of unstable small positional diff between it and the target like moving forward while knockinng back the entity
            return
        }
        if (onGround) {
            console.log("Entity is walking");
            this.playWalkAnimation();
            this.playWalkSound();
        }
        if ((jumpProactively || this.canJumpOntoObstacle()) && !this.shouldStepUp && onGround) {
            console.log(".*Entity is jumping");
            this.playJumpAnimation();
            this.moveCharacterUp();
        };
        this.moveCharacterForward();
        
        console.log("Entity Obstacle height: ",this.obstacleHeight);
        console.log("Entity Obstacle distance: ",this.obstacleDistance);
        console.log('Entity should step up: ',this.shouldStepUp);
    }
    private moveAgent(finalDestY:number) {
        if (!this.isFinalDestClose) {
            this.autoMoveForward(finalDestY);
        }
    }


    // Helper method to get horizontal forward direction
    private getHorizontalForward(): THREE.Vector3 {
        const charDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.character.quaternion);
        return new THREE.Vector3(charDirection.x, 0, charDirection.z).normalize();
    }
    private distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt((dx * dx) + (dz * dz));
    }




    private getAngleDiff(path:THREE.Vector3):degrees {
        const direction = path.clone().sub(this.character.position);
        const charDirection = new THREE.Vector3(0,0,-1).applyQuaternion(this.character.quaternion)
        const angleDiff = Math.atan2(charDirection.x,charDirection.z) - Math.atan2(direction.x,direction.z);
        const normAngle = (angleDiff + (2*Math.PI)) % (2 * Math.PI) ;//we normalized the angle cuz its measured in radians not degrees
        const normAngleInDegrees = Number((normAngle * (180/Math.PI)).toFixed(2));
        return normAngleInDegrees;
    }
    private getSteeringDirection(path:THREE.Vector3):'right' | 'left' | null {
        const angle:degrees = this.getAngleDiff(path)
        const rotationThreshold = 10;//the magnitude of the rotation diff before it rotates to the target direction
        if (angle > rotationThreshold) {
            return (angle < 180)?'right':'left'
        }
        return null
    }




    private useClockwiseScan:boolean = true;
    private timeSinceLastFlipCheck: number = 0;
    private flipCheckInterval:seconds = 1; // Minimum time interval between perimeter scan flip checks.Note: The flip check runs only when certain navigation conditions are met,so actual flips happen discretely, not strictly every interval.fine tune as needed to control the interval of flip checks
    private minProgressThreshold: number = -1; //i can make it 1 to prevent situations where they get stuck.but this may be strict if some declination in progress like -1 is required to make progress but allowing that can get it stuck in a place.so its a tradeoff
    private distSinceLastDelta: number | null = null;
    private static readonly zeroVector = new THREE.Vector3(0,0,0);


    protected decidePerimeterScanDirection(distToOriginalPath:number,distSinceLastDelta:number) {
        const progress = distSinceLastDelta - distToOriginalPath;
        console.log('Perimeter. Progress:', progress);
        if (progress < this.minProgressThreshold) {
            this.useClockwiseScan = !this.useClockwiseScan;
            console.log('Perimeter. Flipped perimeter scanning direction.');
        }
        this.distSinceLastDelta = distToOriginalPath;   
    }

    private terminateBranch() {
        this.obstacleClearancePoint.copy(Controller.zeroVector);//removing any possible clearance point and terminating the branch
        this.branchedPath = null;
        console.log('.:Cleared this branch');
    }

    private isNearOriginalPath:boolean = false;
    private spaceCooldown = combatCooldown; // cooldown duration in seconds
    private spaceTimer = 0;

    protected navToTarget(originalPath:THREE.Vector3,rotateAndMove:boolean):boolean {//targetpos is the player for example
        this.timeSinceLastFlipCheck += this.clockDelta || 0;
        const characterPos = this.character.position;
        const distToOriginalPath = characterPos.distanceTo(originalPath);//im using hypot dist here cuz i need the distance to reflect all the comp before deciding that its close to it cuz this is where it terminates the navigation but its not the sole factor used to determine that.i also included in the y level diff check

        const YDifference = Math.abs(Math.round(characterPos.y - originalPath.y));
        const onSameYLevel = YDifference < 2.5;
        const targetReachedDistance = 3//this defines how close the entity must be to the original path before it considers it has reached it and stops navigating towards it.its a tight threshold ensuring that the entity reaches the target/original path at a reasonable distance before stopping
        const hasReachedOriginalPath =  (onSameYLevel) && (distToOriginalPath < targetReachedDistance);

        if (hasReachedOriginalPath || this.isNearOriginalPath) {//the current value of isNearOriginalPath will come in the next frame before using it to make its decision.cuz its needed for automoveforward to know it should stop moving the entity.if i use it to return from here,that opportunity wont happen and the entity wont preserve any space between it and the target
            this.spaceTimer += this.clockDelta || 0;
            this.terminateBranch();
            this.stopWalkSound();
            console.log('.:Reached original path');
            if (this.spaceTimer > this.spaceCooldown) {//i used a cooldown to retain this space for some time or else,it will just go straight to the target again
                this.isNearOriginalPath = false
                this.spaceTimer = 0
            }
            return true
        } 

        if (this.branchedPath) {
            const distToBranchedPath = this.distanceXZ(characterPos, this.branchedPath);// i used xz distance here not the hypotenuse distance to discard the y component when deciding the dist to a branch cuz taking its y comp into account can take it forever before it considers it has reached there and its y comp isnt important to the final goal.
            const distToBranchedPathThresh = (this.prioritizeBranch) ? 5 : 10;//i priortized the branch created from the clearance point set by the foremost ray.cuz the foremost ray oly nudges the clearance point a little to the side so the dist will be very small so setting a smaller threshold for it means that it will easily overlook clearing the branch.but for the bracnch created from the side ray,i made the threshold stricter by making it 10.so it will clear it at 9 units away from the branch
            const hasReachedBranch = (distToBranchedPath < distToBranchedPathThresh);

            const rebranchDistance = 10//this defines how close must the entity be to the original path before it discards the branch its going to and to go back to the original path.this is to make it to discard a branch when the original path is close
            const rebranchToOriginalPath =  (onSameYLevel) && (distToOriginalPath < rebranchDistance);

            console.log('Entity distToBranchedPath:', distToBranchedPath);
            console.log('distToBranchedPathThresh:', distToBranchedPathThresh);

            if (hasReachedBranch || rebranchToOriginalPath) {
                this.terminateBranch();
                if (this.distSinceLastDelta === null) {
                    this.distSinceLastDelta = distToOriginalPath;
                }
                if (this.timeSinceLastFlipCheck >= this.flipCheckInterval) {
                    this.timeSinceLastFlipCheck = 0;
                    this.decidePerimeterScanDirection(distToOriginalPath,this.distSinceLastDelta);
                }
            }
        }else {
            this.timeSinceLastFlipCheck = 0;
        }
         //this reads that the entity should walk around the obstacle if there is an obstacle,it cant walk forward,it has not reached close to the target and it knows for sure it cant jump,then it should walk around the obstacle
        
        const shouldWalkAroundObstacle = (
            (this.obstacleDistance !== Infinity) && 
            (!this.isFinalDestClose) && 
            (!this.canJumpOntoObstacle()) &&
            (!this.shouldStepUp || !this.canWalkForward)
        ) 
        console.log("Entity path| branched path: ",this.branchedPath);
        console.log("Entity path| compare original path: ",originalPath);
        console.log("Entity path| compare char pos: ",characterPos);
        console.log("Entity movement| should walk around obstacle: ",shouldWalkAroundObstacle);


        const currentPath = this.branchedPath || originalPath;
        const finalPath = currentPath.clone();
        if (shouldWalkAroundObstacle && !(this.obstacleClearancePoint.equals(Controller.zeroVector)) ) { 
            finalPath.copy(this.obstacleClearancePoint);
            this.branchedPath = finalPath;
            console.log('Entity path| finalPath:',finalPath);
        }

        const finalDir = this.getSteeringDirection(finalPath)
        const distToFinalDest = this.distanceXZ(characterPos,finalPath)//the reason why i used xz dist instead of hypot distance is so that it ignores the y component cuz if not,it will walk directly under me when i jump making me to always land on it when i jump which isnt the desired behaviour.because i didnt take into account the y comp,i made the threshold tighter down to 2 instead of 5.i did this on the final dest not the original path cuz its this that affects how it moves.which is why i kept the dit to original path as hypot distance
        const epsilon = 0.01;
        let distToFinalDestThresh = 2;//this is to tell the algorithm how close to the target the character should be to be considered its close to the target or far from the target.

        if (currentPath.distanceTo(finalPath) > epsilon) {//means they are different
            distToFinalDestThresh = 0.1//by making the threshold for closeness tight,im making it easy for the algo to see this a far so that it can walk towards it cuz the dist diff on the intial obstacle turn is too short
        }

        this.isFinalDestClose = distToFinalDest < distToFinalDestThresh;
        this.isNearOriginalPath = (onSameYLevel) && (distToOriginalPath < 6);//this is used to control spacing between the entity and the target to prevent jitter when it knocks me back while coming at me
        
        if (rotateAndMove) {
            if (finalDir !== null) this.rotateCharacterX(finalDir);
            this.moveAgent(finalPath.y);
            return false
        }
        if (shouldWalkAroundObstacle) {//if should walk aroud an obstacle,i want it to move and rotate at the same time for a fluid walk around the obstacle's perimeter
            if (finalDir !== null) this.rotateCharacterX(finalDir);
            this.moveAgent(finalPath.y);
        }else {//if its not walking around an obstacle,i want it to either rotate or move but not at the same time in the same frame.this is for precision
            if (finalDir !== null) this.rotateCharacterX(finalDir);
            else this.moveAgent(finalPath.y);
        }
        return false
    }




    
    private checkIfCanWalkForward(prevCharPosition:THREE.Vector3) {//defense mechanism to catch failures of shouldStepUp cuz of faulty collision detection
        if (!this.characterRigidBody) return;
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



    private applyKnockback() {
        if (!this.characterRigidBody) return;
        if (this.isKnockedBack && !this.appliedKnockbackImpulse) {
            this.characterRigidBody.applyImpulse(this.impulse,true);
            this.appliedKnockbackImpulse = true;
            this.shouldPlayJumpAnimation = true;
        }
        if (this.knockbackTimer > this.knockbackCooldown) {//i cant reset it to false immediately under the same frame so it needs to reflect this change so i used a cooldown
            this.isKnockedBack = false;
            this.appliedKnockbackImpulse = false
            this.knockbackTimer = 0;
        }
    }
    private applyVelocity():void {  //i locked setting linvel under the isgrounded check so that it doesnt affect natural forces from acting on the body when jumping
        if (!this.characterRigidBody) return;
        const prevCharPosition = new THREE.Vector3(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z);
        console.log('Character| prevCharPosition:', prevCharPosition);
        if ((this.isGrounded() || this.shouldStepUp) && !this.isKnockedBack) {
            this.characterRigidBody.setLinvel(this.velocity,true);
            this.checkIfCanWalkForward(prevCharPosition)
        };
        this.applyKnockback();
        this.characterPosition = this.characterRigidBody.translation();//its important to do this after the if statement
    }


    //todo:Find a good place reset obstacle height.im not sure if it will work here
    private resetSomeVariables():void {
        this.velocity.set(0,0,0);//to prevent accumulaion over time
        this.dynamicData.horizontalVelocity = this.originalHorizontalVel;//the horizontal velocity is subject to runtime mutations so i have to reset it
        this.shouldStepUp = false;
        this.obstacleDistance = 0;
        this.groundIsPresentForward = false;
         // this.obstacleHeight = 0;
    }



    private updateKnockbackCooldown() {
        if (this.isKnockedBack) {
            this.knockbackTimer += this.clockDelta || 0;
        }
    }
    private updateCharacterAnimations():void {
        if (this.mixer) this.mixer.update(this.clockDelta || 0);
    }
    private updateCharacterTransformations():void {
        if (!this.characterRigidBody) return;
        //i minused it from ground detction distance to get it to stay exactly on the ground
        const [posX,posY,posZ] = [this.characterPosition.x,this.calculateGroundPosition()+0.5,this.characterPosition.z];
        this.character.position.set(posX,posY,posZ);
        this.character.quaternion.slerp(this.targetQuaternion,this.dynamicData.rotationSpeed);
        this.characterRigidBody.setRotation(this.targetQuaternion,true);
    }

    
    protected respawn() {
        if (!this.characterRigidBody) return;
        this.characterRigidBody.setTranslation(this.fixedData.spawnPoint,true);
        this.characterPosition = this.characterRigidBody.translation();
        this.character.position.set(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z);
    }
    private respawnIfOutOfBounds():void {
        this.isOutOfBounds = false
        if (this.characterPosition.y <= outOfBoundsY) {
            this.isOutOfBounds = true
        }
    }


    
    private impulse:THREE.Vector3 = new THREE.Vector3();
    private isKnockedBack:boolean = false;
    private appliedKnockbackImpulse:boolean = false;//to debounce the knockback

    private knockbackTimer:number = 0;
    private knockbackCooldown:seconds = combatCooldown;//to give the physics engine time to reflect the knockback

    public knockbackCharacter(direction:'forward'| 'backwards',knockbackImpulse:number,scalar?:number):void {
        this.wakeUpBody();
        const upwardScalar = 3
        const dir = new THREE.Vector3(0,0,(direction=='forward')?-1:1);
        const knockbackDir = dir.applyQuaternion(this.character.quaternion)
        const impulse = new RAPIER.Vector3(
            knockbackDir.x * knockbackImpulse,
            knockbackImpulse * (scalar || upwardScalar),
            knockbackDir.z * knockbackImpulse
        );
        this.impulse.copy(impulse);
        this.isKnockedBack = true;
        this.playPunchSound();
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
        if (!this.characterRigidBody) return;
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
    public playJumpAnimation():void {
        if (this.mixer && this.jumpAction) this.fadeToAnimation(this.jumpAction);
    }
    protected playWalkAnimation():void {
        if (this.mixer && this.walkAction && this.attackAction && !this.attackAction.isRunning()) {
            this.fadeToAnimation(this.walkAction);
        }
    }
    public playIdleAnimation():void {//i made it public for use by classes composed by the entity
        if (this.mixer && this.idleAction && this.attackAction) {
            if (!this.attackAction.isRunning()) {
                this.fadeToAnimation(this.idleAction);
            }
        };
    }
    protected playAttackAnimation():void {
        if (this.mixer && this.attackAction && this.deathAction){
            if (!this.deathAction.isRunning()) {
                this.fadeToAnimation(this.attackAction);
            }
        }
    }
    protected playDeathAnimation():void {
        if (this.mixer && this.deathAction) {
            this.fadeToAnimation(this.deathAction);
        }
    }


    protected playWalkSound():void {
        if (!walkSound.isPlaying) walkSound.play();
    }
    protected playPunchSound():void {
        if (!punchSound.isPlaying) punchSound.play();
    }
    protected stopWalkSound():void {
        walkSound.stop();
    }
    protected stopPunchSound():void {
        punchSound.stop();
    }

    

    protected addObject(externalObject:THREE.Object3D):void {//any object that must be added like a camera for a player should be done through here.it reuqires the class to put any object he wants under a threejs 3d object
        this.character.add(externalObject)
    }
    protected removeObject(externalObject:THREE.Object3D):void {
        this.character.remove(externalObject)
    }

    

    get updateController():(deltaTime:number) => void {
        return this.updateCharacter
    }
    get char():THREE.Group {
        return this.character
    }
    get position():THREE.Vector3 {
        return new THREE.Vector3(this.characterPosition.x,this.characterPosition.y,this.characterPosition.z)
    }



    private velocitiesY:number[] = []
    protected velBeforeHittingGround:number = 0;

    private updateVelJustAboveGround() {
        if (!this.characterRigidBody) return;
        this.velBeforeHittingGround = 0;//the effect of this reset is in the next frame not in the current one since i didnt clear it after setting it
        if (this.velocitiesY.length >= 2) this.velocitiesY.shift();
        const verticalVel = Math.round(this.characterRigidBody.linvel().y);
        this.velocitiesY.push(verticalVel);
        const firstVel = this.velocitiesY[0];
        const secondVel = this.velocitiesY[1];
        if ((Math.sign(firstVel) == -1) && (secondVel == 0)) {
            this.velBeforeHittingGround = Math.abs(firstVel)
        }
    }

    protected abstract onLoop():void//this is a hook where the entity must be controlled before updating
    private forceSleepIfIdle() {
        if (!this.characterRigidBody) return;
        if (this.isGrounded() && !this.characterRigidBody.isSleeping() && !this.isKnockedBack) {// im forcing the character rigid body to sleep when its on the ground to prevent extra computation for the physics engine and to prevent the character from consistently querying the engine for ground or obstacle checks.doing it when the entity is grounded is the best point for this.but if the character is on the ground but he wants to move.so what i did was that every exposed method to the inheriting class that requires modification to the rigid body will forcefully wake it up before proceeding.i dont have to wake up the rigid body in other exposed functions that dont affect the rigid body.and i cant wake up the rigid body constantly at a point in the update loop even where calculations arent necessary cuz the time of sleep may be too short.so by doing it the way i did,i ensure that the rigid body sleeps only when its idle. i.e not updated by the inheriting class.this means that the player body isnt simulated till i move it or jump.
            this.characterRigidBody.sleep();
        } 
    }
    
     //in this controller,order of operations and how they are performed are very sensitive to its accuracy.so the placement of these commands in the update loop were crafted with care.be cautious when changing it in the future.but the inheriting classes dont need to think about the order they perform operations on their respective controllers cuz their functions that operate on the controller are hooked properly into the controller's update loop and actual modifications happens in the controller under a crafted environment not in the inheriting class code.so it meands that however in which order they write the behaviour of their controllers,it will always yield the same results
    private updateCharacter(deltaTime:number):void {//i made it private to prevent direct access but added a getter to ensure that it can be read essentially making this function call-only
        if (!this.characterRigidBody) return;
        this.clockDelta = deltaTime;
        this.forceSleepIfIdle();
        this.updateKnockbackCooldown();
        this.updateVelJustAboveGround();
        this.onLoop();
        this.updateCharacterAnimations();//im updating the animation before the early return so that it stops naturally 
        if (this.characterRigidBody && this.characterRigidBody.isSleeping()) {
            console.log("sleeping...");
            return;//to prevent unnecessary queries.Since it sleeps only when its grounded.its appropriate to return true here saving computation
        }else {
            this.points.clear();
            this.applyVelocity();
            this.updateCharacterTransformations();
            this.updateObstacleDetectionDistance();//must be called before resetting cuz it relies on a variable that needs to be used befor it gets reset
            this.resetSomeVariables();//must be called before obstacle detection to prevent overriding its result
            this.detectObstacle();
            this.respawnIfOutOfBounds();
            if (this.characterRigidBody) {
                this.characterRigidBody.setGravityScale(this.dynamicData.gravityScale,true);
            }
        }
    }
}