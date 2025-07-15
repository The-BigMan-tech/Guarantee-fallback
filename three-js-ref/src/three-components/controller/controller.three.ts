import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,gravityY,outOfBoundsY, combatCooldown} from "../physics-world.three";
import { walkSound,punchSound,landSound } from "../listener/listener.three";
import {v4 as uniqueID} from "uuid"

//these methods are to create line geometries for their respective shapes.they are used to visualize hitboxes for visual debugging
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
//this is data fpr the controller that cant or should not be changed after creation
export interface FixedControllerData {
    modelPath:string,
    spawnPoint: RAPIER.Vector3,
    characterHeight:number,
    characterWidth:number,
    shape:'capsule' | 'box'
    mass:number,
}
//this is data for the controller that can change dynamically after creation
export interface DynamicControllerData {
    maxStepUpHeight:number,
    jumpVelocity:number,
    jumpResistance:number,
    horizontalVelocity:number,
    rotationDelta:number,//angle in radians
    rotationSpeed:number,
    gravityScale:number
}
//these are just type aliases to improve clarity on the units used
type degrees = number;
type seconds = number;

//The controller class is a class to create and manage dynamic rigid bodis in the world with the ability to control these bodies with simple interfaces at runtime.it is used for players and entities.I encourage blocks to be made with a static physics body because of perf.so this class isnt meant for blocks.

//i made it an abstract class to prevent it from being directly instantiated so that its internals remain hidden from instances for safety.This controller is meant to be extended to concrete types and there are two current classes that inherit from this that already covers majority of the uses of this controller-the player and entity class which itself can be used to create other entities with complex behaviour.the class exposes a hook thats called in every update loop at a point where its safe to add concrete specific behaviour in a way that it always correctly reflects the state of the controller.the concretes dont need to know how or at what point their hook is called but they do know that in the hook,they can define all the high level behaviour they want to dynamically control the controller.

//through out the codebase,im using private-first encapsulation.This is to ensure data safety and to prevent accidental mutation to internals.most times when i want to reduce strictness,i use protected but only when absolutely necessary that i use public because there will always be some method that needs public access for the other parts of the codebase to use.
export abstract class Controller {
    private static readonly showHitBoxes = false;//this is used to toggle the hitboxes for visual debugging.i made it static to make it easy to tune this for all controller concretes
    private static readonly showPoints = true;//this toggles explicitly colored points for visual debugging.if you are directly working on the internals of this controller,then you can color any point you want to visualize for debugging purposes using the color point method and just make sure that you add the point group to the scene along side the group containing the character which has already been done for the player and the entities.all you have to do is to call this on any vector representing a point and it will handle updating thse point every frame as well as clearing the ones from the previous frame.

    protected dynamicData:DynamicControllerData;//needs to be protected so that concretes can change this dynamically at runtime but not public to ensure this data retains its integrity
    private fixedData:FixedControllerData;
    private character: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();//this is the group that holds all the 3D objects for this controller.it should be added to the scene directly to render the controller in game
    private characterBody: RAPIER.RigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();//we are using a dynamic rigod body because thats what the controller is made for
    private characterPosition:RAPIER.Vector3;//this variable is used to hold the position of the rigid body.its updated at every frame so it accurately reflects the position of the rigid body.i used this when i need to access the rigid body position throughout the codebase instead of rigidbody.translation directly cuz its easier to type,read and it follows the pattern where modifications arent done directly on the object but on a target variable before using that target variable to apply the desired modifiations on the body.
    private characterCollider: RAPIER.ColliderDesc
    protected characterRigidBody:RAPIER.RigidBody | null;//im only exposing this for cleanup purposes
    private readonly characterColliderHandle:number;//im holding the handle of this character for identity checks like to prevent detecting the character's own body when making physics queries
    private charLine: THREE.LineSegments;//this is the 3D object containing the edge geometry to create the hitboxes

    private readonly modelZOffset:number = 0.3;//this is to offset the model backwards a little from the actual character position so that the legs can be seen in first person properly without having to move the camera cuz relatively moving the camera can lead to misalignment cuz the camera position wont actually align with the characters center which is used as the pivot for rotation

    private obstacleHeight: number = 0;//this tells the height of the immediate obstacle infront of the controller.0 means no obstacle height therefore no obstacles while any non-zero integer means that there is an obstacle ahead of a given height.
    private obstacleDetectionDistance:number = 0;//this is the distance ahead of the controller where obstacles are queried/detected.it allows for more natural gameplay exp than detecting directly infront of the controller cuz it allows the controller to prepare ahead of time.for example,to smoothly step over an obstacle,the controller must know that before the player gets to collide with it to make it a natural walk.else,it will hit the obstacle,then go up producing a less natural feel.

    private groundDetectionDistance:number;//this is a calcualted variable that is deducted from the character's y position to know which point below the character should a query for the ground be made.
    
    private velocity:THREE.Vector3 = new THREE.Vector3(0,0,0);//im using velocity to directly control the character movement cuz it leads to more controlled movements unlike impulse which can cause sliding and force which can pile up over time unless i manually reset the forces.

    //these variables are already self explanatory
    private targetRotation:THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private targetQuaternion:THREE.Quaternion = new THREE.Quaternion();

    //this is just a flag i use to control exactly when the landing sound is made cuz unlike the other sounds,this sound has to be played at the right time which is when the character makes an impact on the ground which cant be done in outside code.it has to be integrated directly into the internals which this already does on behalf of the concretes.
    private playLandSound: boolean = true; 
    
    //this stores the current time since the last delta.i have a global clock that i use to get the delta and i pass it to every controller to store here for easy access/
    protected clockDelta:number | null = null;

    //these are animation specific variables
    protected mixer: THREE.AnimationMixer | null = null;//im only exposing this for cleanup purposes
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private walkAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;
    private attackAction:THREE.AnimationAction | null = null;
    private deathAction:THREE.AnimationAction | null = null;

    //this is a flag used to control whether the controller should step over an obstacle or not
    private shouldStepUp: boolean = false;
    //this is a flag used to state whether the controller is allowed to play the jump animation or not.
    private shouldPlayJumpAnimation: boolean = false;

    //this stores the original horizontal velocity in order to revert back to it after dynamic modification to the horizontal velocity.i made this especially for sprinting mechanics and which is why i didnt create variables to revert to for the other dynamic properties like jump velocity.
    private originalHorizontalVel:number

    public points:THREE.Object3D = new THREE.Object3D();//this is the 3d group containing the points for visual debugging that are added to the scene
    private readonly pointDensity = 1.5;//this is used to control the number of points per unit distance in teh obstacle detection distance.obstacle detection distance doesnt just check a fixed point ahead of the player but also other points in between that.this is used to detect obstacles that might just appear infront of the player and the point density is tied to this as already mentioned

    private obstacleDistance:number = 0;//unlike obstacledetection distance which is a fixed unit telling the contoller how far to detect obstacles ahead of time,this one actually tells the realtime distance between an approaching obstacle and the controller.its always smaller or equal to obstacle detection distance because obstacles arent detected beyond that distance to even update this variable in the first place
    
    private widthDebuf:number//this is a calculated variable used to deduct from the calculated ground position because my ground detection distance doesnt take into account the width of the controller.its confusing how width influences the accuracy of groud position calculation but it does as according to the playtest.so this fixes that allowing the controller to now work with arbritary widths and heights.but still test thoruoghly.

    private obstacleClearancePoint:THREE.Vector3 = new THREE.Vector3();//this is used specifically to lead a navigator around an obstacle.a navigator is a controller that uses the navigation method to move like the entity instead of manual controls like the player.

    private isFinalDestClose = false;//this is used by nav system to know how close the controller is to its final destination whether its the original path or a branch.
    private branchedPath:THREE.Vector3 | null = null;//this holds the point to the branched path when navigatiing which is a temporary path that lead the entity away from an obstacle before resuming back to its original target.the controller only remebers one branch point at a time for predictability and memory.one branch is enough for it to branch multiple times because when it reaches a branch point,it can then set a new branch point from the point its already standing on essentially creating multiple branches around an obstacle while still only remembering one branch at a time.the only thing is that it cant backtrace its steps back to the target so after it has branched enough,it goes straight to the target and repeats the nav mechanism again to reach the goal without bactracing its steps from branch to branch.

    //this variable is used to tell whether the controller is blocked by an obstacle or not by checking if it can walk forward.unlike obstacle dtectio which is proactive by using phsyics queries,this one is reactive by checking the velocity which captures non movement at any point of impact.it used as a backup for the nav system to catch possible errors where obstacle detection may be bugged.although this is unlikely as shown in checks,this is a good defensive mechanism
    private canWalkForward:boolean = false;

    //this is used to inform concretes if they are out of bounds like out of the world.this is to ensure that they are eithe respawned in the case of the player or killed in the case of entities.since the world is procedurally genrated around the player,its highly unlikely that the player will fall out of bounds since the base floor is indestructibe but i still left that respawning when out of bounds cuz i made it at the time where the world was finite and besides,its a good defensive check where the player may glitch of the world unexpectedly in cases of high falling velocities or something like that.As for the entities,i use this especially as an easy way to clean entities that are off the chunk without explicitly limiting the despawn radius to the chunk distance.it allows me to decouple those variables improving overall clarity.
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
        this.groundDetectionDistance = halfHeight + 0.5 + ((fixedData.characterHeight%2) * 0.5);//this formula wasnt just decided,it was designed.i made the formula after trying different values that each worked for a given hardcoded heights,saw a pattern and crafted a formula for it

        this.originalHorizontalVel = dynamicData.horizontalVelocity;

        this.charLine.position.set(0,fixedData.characterHeight + 1,this.modelZOffset)//these are artificial offsets to the hitbox relative to the character cuz the position can never be fully accurate on its own.so it needs this for it to be visually accurate
        if (Controller.showHitBoxes) this.character.add(this.charLine);

        this.loadCharacterModel();
    }
    private calculateGroundPosition() {
        const initGroundPosY = Number((this.characterPosition.y - this.groundDetectionDistance).toFixed(2)) - 1;//the -1 is required to sink the point a little into the ground to prevent the point from stopping just above the ground which will make the query ineffective for gettng the ground position.
        const finalGroundPosY = Number((initGroundPosY - this.widthDebuf).toFixed(1))//we also want to consider the width debuf as said earlier
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
                obj.material.metalness = 0.2; 
                obj.material.roughness = 0.4;   
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
    //these velocity calc methods are used to calculate the effective upward and forward velocity required to walk over an osbtacle as detected ahead of the controller by a method
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
    //this is the method that colors any point for visual debugging
    protected colorPoint(position:THREE.Vector3, color:number) {
        if (!Controller.showPoints) return;
        const geometry = new THREE.SphereGeometry(0.06,8,8); // Small sphere
        const material = new THREE.MeshBasicMaterial({ color: color });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position); // Set position
        point.position.y -= 0.5;
        this.points.add(point);
    }
    //this is to color the ground point but im not currently using it cuz the ground point jitters about a fixed position because of float precision changes per frame or something like that
    private colorGroundPoint() {//i rounded the height cuz the point doesnt always exactly touch the ground
        const point:THREE.Vector3 = new THREE.Vector3(this.characterPosition.x,Math.round(this.calculateGroundPosition()),this.characterPosition.z);
        this.colorPoint(point,0xffffff)
    }

   //this just uses the calculated ground point to query for the ground to know if the controller is grounded or not.i used it to determine which forces to apply on the controller to move its body like linear velocity for movement,impulse for knockback and no explicit velocity control when jumping to make jumping feel more natural.
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
            this.calculateGroundPosition() + 1,//The +1 is required to counter the sinking in the ground position calculation.the sinking has its purpose there but in the context of detecting obstacles,we dont want the sinking so that one,we can see the points in the visual debugger and two,to prevent a heavy lag because if we were to leave it sinking,the point always collides with an obstacle which is the ground which will make dozens of physics queries every frame which will severly lag the game.since this method is used specifically in obstacle detection,then we need to remove the sinking.
            this.characterPosition.z + (dir.z * distance)
        );
        return point
    }
    //todo:make the margin to be equal the jump distance.
    private updateObstacleDetectionDistance() {
        const delta = this.clockDelta || 0;
        //*Be cautious when changing this margin.it has to be smaller or equal to the distance that the entity can jump or else,it will never jump
        const margin = 5; // tune as needed.its how far ahead do you want to detect obstacles in addition to the calculated dist which is usually below 1 cuz delta frames are usually fractions of a second
        this.obstacleDetectionDistance = (this.dynamicData.horizontalVelocity * delta) + margin
        console.log("Obstacle detection distance: ",this.obstacleDetectionDistance);
    }
    private getSteps(maxDistance:number,density:number) {//this controls how many points exist from the controller's position and the point of obstacle detection.it uses point density to influence this and its capped for performance
        let steps = Math.floor(maxDistance * density);
        const minSteps = 3;
        const maxSteps = 10;
        steps = Math.min(Math.max(steps, minSteps), maxSteps);
        return steps
    }
    //this calcukates the height of an obstacle by starting from a clearance point downwards till there is no clearance which is where an obstacle has been detected.we can then use this point to get the relative height of an obstacle
    private calcHeightTopDown(stepOverPos:THREE.Vector3,groundPosY:number) {
        const downwardCheckPos = stepOverPos.clone();//i cloned it to prevent subtle bugs if i reuse stepoverpos later
        const increment = 0.1;//the reason why i used a float this precise for the increment is to improve its robustness.this is because the blocks i generated in my world had random heights between x to y but not in whole integers but in floats.so when i used 1 here as the increment,it led to a subtle bug where the height was calculated as 2 but in reality,it was actually 2.2 leading to false positives that made the controller to attempt to step over the obstacle using a calculated upward and forward velocity that wasnt the actucal required velocity to overcome the obstacle and it wasnt suppose to walk over it in te first place which also led to a bug where calc clearance for agent was never called so my entity got stuck.but using smaller increments takes more runtime than big steps but this negligible for the gains in precision.
        for (let i=0;i <= this.dynamicData.maxStepUpHeight;i+=increment) {
            let downwardClearance = true
            downwardCheckPos.sub(new THREE.Vector3(0,increment,0));

            physicsWorld.intersectionsWithPoint(downwardCheckPos,()=>{
                const relativeHeight = Number((downwardCheckPos.y - groundPosY).toFixed(2));//i fixed it to 2dp to make the result more concise.the obstacle height used here is a relative height not an absolute one.an absolute one is just directly uses the y pos without subtracting it from the ground pos and its effective enough for situations where the controller and all the obstacles are on the same ground level like a flat world with disperesed platforms but its not robust enough on terrains cuz blocks can be stacked on top of each other and you can be standing on a block next to the stacked block and its more important to know the height from where you are standing than wherever the obstacle stands on.so using relative height here is more robust
                console.log('relative downwardCheckPos:', downwardCheckPos.y);
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
    //this calcuates the height of an obstacle by starting from a given point and going upwards till there is clearance which infers that the point of clearance is where the osbtacle height stops which can be used for other calculations.
    private calcHeightBottomUp(stepOverPos:THREE.Vector3,groundPosY:number) {
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
                const relativeHeight = Number((upwardCheckPos.y - groundPosY - 0.1).toFixed(2));//the relative height here is actually 0.1 more than its actually supposed to be cuz i used hardcoded heights to test this and since it was the same precision error across many hardcoded heights,i just decided to subtract 0.1 from it to fix it.
                console.log('relative upwardCheckPos.y:', upwardCheckPos.y);
                this.obstacleHeight = relativeHeight
                console.log("Relative height checked up: ",relativeHeight);
                break;
            }
        }   
    }
    //this is used to prioritize branches created by the foremost and side ray
    private prioritizeBranch:boolean = false;

    private calcClearanceForAgent(point: THREE.Vector3,purpose:'foremostRay' | 'sideRay') {
        const horizontalForward = this.getHorizontalForward();
        const maxWidthToCheck = 40;
        const reachedPreviousClearance = this.obstacleClearancePoint.equals({x:0,y:0,z:0})//this states whether the controller has reached the previous clearance point used to lead it away from an obstacle.i used a zero vector equality check cuz it only clears to 0 when the entity has reached the previous branch
        
        console.log('reachedPreviousClearance:', reachedPreviousClearance);
        
        //the purpose of this point cast is to lead the agent along the wall of an obstacle by shooting forward till there is no obstacle ahead of it which means that it has sucessfully walked along the wall.youll understand this better if you see it yourself using the visual debugger.

        if ((purpose == 'sideRay') && reachedPreviousClearance) {//only the side or foremost ray can be called at a time per call.
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
        //the purpose of this point cast is to create that initial turn against an obstacle wall by nudging the clearance point to the side.youll better understand it by using the visual debugger.

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
            if ((i == firstPoint)) {//the side ray is offset to the right or left depending on the perimater scan direction.this is because when an entity walks along a wall,a point has to offshoot from its side towards the wall to continuously dteect for a clearance point along the wall.it always shoots forward regardless of perimeter scan direction but it can offshoot either left or right.i made it the behind or first point so that the foremost ray takes precedence since the loop is from the back to the foremost ray.the foremost ray is more important cuz it causes that intial turn which prevents it from getting stuck on perpendicular adjacent blocks cuz the sideary alone,will tell it that it can still move forward along the wall without considering if there is already a wall blocking that path.the foremost ray doesnt get offset to the left or ight.it remains unshifted but its direction of point cast which is either forward or backward is influenced by the perimeter scan.this different behaviour to the same state is as a result of their differnt positioning and purpose.
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

                const groundPosY = Math.floor(offsetPoint.y);//i floored it to clarify the ref point so that rather than 0.7 or 0.1,its 0.why floor specifically?i can instead use round or ceil.but the reason why i made this decision was because of feedback from game testing and the logs.i tested this in an env where i knew the exact height of the obstacles i was testing against but i needed the algo to know that.so after iteratively playing with precision,floor was the best choice.for something like ground ref,flooring it is better cuz it provides a stable ref point across all floats of a particular number.its more stable than round which is biased to higher floats and its better than ceil thats too generous to lower floats
                const stepOverPosY = (groundPosY + this.dynamicData.maxStepUpHeight)+0.1//so what we want to do here is to check for the point at the height just above what the character can step over before taking clearance checks from there to get the exact height.we could have used 1 but it misses on float heights so 0.1 is more precise.it catches the height more accurately
                const stepOverPos = new THREE.Vector3(offsetPoint.x,stepOverPosY,offsetPoint.z)


                this.obstacleDistance = distance

                console.log('relative stepOverPosY:', stepOverPosY);
                console.log('relative groundPosY:', groundPosY);
                console.log('this obstacleDistance:', this.obstacleDistance);

                let clearance = true;
                physicsWorld.intersectionsWithPoint(stepOverPos, () => {
                    clearance = false
                    return false
                })
                if (clearance) {//so if there is clearance,we will want to check the height of the obstacle by moving the point down to the point of no clearance then we can take that point and subtract it from the ground position to know the relative height
                    this.calcHeightTopDown(stepOverPos,groundPosY)            
                }else {//Else,if there is no clearance,we will want to check for the height by moving the point up till there is clearance then use that point relative to our ground pos to get the relative height.We also want to get the clearance point for the agent only when it cant step over it which occurs when it has to check for the obstacle height bottom up rather than top down cuz it will lead to unnecessar calc and cost perf if we do this in every frame even when we dont need it
                    this.calcHeightBottomUp(stepOverPos,groundPosY);
                    if ((i == foremostPoint) || (i == firstPoint)) this.calcClearanceForAgent(offsetPoint,purpose);
                }
                return true
            });    
        }
        if (!hasCollidedForward) {
            this.obstacleDistance = Infinity//infinity distance means there are no obstacles
        }
        this.checkForGroundAhead(steps+1,forward)//this is used for proactive jumping for the agent so that it can jump from block to block that have gaps between them not just when it has reached the wall of an obstacle.this allows for parkour like behaviour
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
    private canJumpOntoObstacle() {//checks if the entity can jump on it based on the horizontal distance  on getting to the obstacle and the obstacle height againts its horizontal and jump velocity
        const reductionX = 12//im adding reduction scales to prevent inflation from high values.They are carefully tuned according to play feedback
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
    private autoMoveForward(finalDestY:number) {//this is used by the nav method to just move forward.thats its only job.it just moves forward and jump if the entity needs to jump.the high level overview of the nav logic is handled by the nav to target method
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
    //helper method to get the distance between two poit vectors by their xz components alone
    private distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt((dx * dx) + (dz * dz));
    }



    //helper to get the angular diff in degrees between a point and the character's position point.
    private getAngleDiff(path:THREE.Vector3):degrees {
        const direction = path.clone().sub(this.character.position);
        const charDirection = new THREE.Vector3(0,0,-1).applyQuaternion(this.character.quaternion)
        const angleDiff = Math.atan2(charDirection.x,charDirection.z) - Math.atan2(direction.x,direction.z);
        const normAngle = (angleDiff + (2*Math.PI)) % (2 * Math.PI) ;//we normalized the angle cuz its measured in radians not degrees
        const normAngleInDegrees = Number((normAngle * (180/Math.PI)).toFixed(2));
        return normAngleInDegrees;
    }
    //uses the angular diff from the helper to decide whether the entity should steer left or right
    private getSteeringDirection(path:THREE.Vector3):'right' | 'left' | null {
        const angle:degrees = this.getAngleDiff(path)
        const rotationThreshold = 10;//the magnitude of the rotation diff before it rotates to the target direction
        if (angle > rotationThreshold) {
            return (angle < 180)?'right':'left'
        }
        return null
    }



    //the flag used to control the perimeter scan diretion of the agent
    private useClockwiseScan:boolean = true;
    private timeSinceLastFlipCheck: number = 0;
    private flipCheckInterval:seconds = 2; // Minimum time interval between perimeter scan flip checks.Note: The flip check runs only when certain navigation conditions are met,so actual flips happen discretely, not strictly every interval.fine tune as needed to control the interval of flip checks
    private minProgressThreshold: number = -1; //i can make it 1 to prevent situations where they get stuck.but this may be strict if some declination in progress like -1 is required to make progress but allowing that can get it stuck in a place.so its a tradeoff
    private distSinceLastDelta: number | null = null;
    private static readonly zeroVector = new THREE.Vector3(0,0,0);

    //this dynamically decides the perimeter scan direction if the entity has made any progress in distance to the target since the last delta time
    protected decidePerimeterScanDirection(distToOriginalPath:number,distSinceLastDelta:number) {
        const progress = distSinceLastDelta - distToOriginalPath;
        console.log('Perimeter. Progress:', progress);
        if (progress < this.minProgressThreshold) {
            this.useClockwiseScan = !this.useClockwiseScan;
            console.log('Perimeter. Flipped perimeter scanning direction.');
        }
        this.distSinceLastDelta = distToOriginalPath;   
    }
    //this clears the branch so that it can resume back on its normal path
    private terminateBranch() {
        this.obstacleClearancePoint.copy(Controller.zeroVector);//removing any possible clearance point and terminating the branch
        this.branchedPath = null;
        console.log('.:Cleared this branch');
    }

    private isNearOriginalPath:boolean = false;
    private spaceCooldown = combatCooldown; // cooldown duration in seconds
    private spaceTimer = 0;
    
    //to break down the different types of paths i have,there are four types;the original path,the branched path,the current path and the final path.the original path is the original goal the entity needs to go.the branched path is the temporary point that the entity goes to in order to evade an obstacle that it cant overcome,the current path is the variable that reflects the path that the entity is taking at the moment which is either the original or branched path while the final path is the current path but it can be branched from there or not.the final path wont live long enough to properly lead the entity to the branch cuz its local and reset on every frame but it lives long enough to steer its facing direction to that branch so that in the next frame,the branched path can take it from there to lead it to the branched point.one may argue that i should cut down this variable and just leave it as 3 path types but having final path is important to properly get it steering to the branched point in the same frame.
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

    //this method applies an impulse to the character.so i can use it for other things besides knockback but take into account that velocity is the main method used to control characters
    public knockbackCharacter(direction:'forward'| 'backwards',knockbackImpulse:number,scalarY?:number):void {
        this.wakeUpBody();
        const upwardScalar = 3
        const dir = new THREE.Vector3(0,0,(direction=='forward')?-1:1);
        const knockbackDir = dir.applyQuaternion(this.character.quaternion)
        const impulse = new RAPIER.Vector3(
            knockbackDir.x * knockbackImpulse,
            knockbackImpulse * (scalarY || upwardScalar),
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

    private controllerId = uniqueID();
    get controllerID() {//this is for testing purposes to clarify different controllers from the logs
        return this.controllerId
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