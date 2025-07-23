import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { Health } from "../health/health";
import { type EntityContract } from "../entity-system/entity.three";
import { entities } from "../entity-system/entity.three";
import { combatCooldown } from "../physics-world.three";
import { setBlockDurability, setEntityHealth, setPlayerHealth } from "../health/health-state";
import { listener } from "../listener/listener.three";
import type { EntityLike } from "../entity-system/relationships.three";
import { groupIDs } from "../entity-system/entity-registry";
import { relationshipManager } from "../entity-system/relationships.three";
import type { seconds } from "../entity-system/global-types";
import { toggleItemGui,isCellSelected, setUsedItem } from "../item-system/item-state";
import { itemManager } from "../item-system/item-manager.three";
import { ItemHolder } from "../item-system/item-holder.three";
import { LookRequest } from "./look-request.three";
import { ItemClone, ItemClones } from "../item-system/behaviour/core/item-clone.three";
import { gltfLoader } from "../gltf-loader.three";
import { createBox, createBoxLine,placementHelper } from "../item-system/behaviour/other-helpers.three";
import { ItemUtils } from "../item-system/behaviour/core/item-utils.three";
import { disposeHierarchy } from "../disposer/disposer.three";
import { spawnDistance } from "../item-system/item-defintions";


// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    cameraRotationSpeed:number;
    offsetY:number | 'auto';
}
interface PlayerMiscData {
    camArgs:PlayerCamData
    healthValue:number,
    attackDamage:number,
    knockback:number,
    strength:number//the player's strength to throw or knockback blocks
}
enum CameraMode {
    FirstPerson = 1,
    SecondPerson = 2,
    ThirdPerson = 3
}
//Note:The player's character only rotates on the x-axis while the camera rotates on the y-axis but by parent transform,the camera also rotates on the x-axis.so to get the quaternion of only the x-axis,use this.char but to get the quaternion on both x and y,use this.camera.cam3d.quaternion.Use the correct quaternion----either local or world quaternion 
class Player extends Controller implements EntityLike {
    private keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private readonly groupID = groupIDs.player;//the player's group id unlike the entities is readonly because its a fixed one not changed dynamically

    private addRelationship = relationshipManager.addRelationship;

    private readonly firstPersonClamp = 75;
    private readonly secondPersonClamp = 70;
    private readonly thirdPersonClamp = 10;
    private cameraClampAngle:number =  this.firstPersonClamp;

    public  health:Health;
    public  currentHealth:number;
    public  camera:Camera;

    private camModeNum:1 | 2 | 3 = 1;//this corresponds to first,second and third person views

    private camRotationSpeed:number;
    private originalCamRotSpeed:number

    private offsetY:number;
    //use these target variables to manipulate the camera's position not directly through mutating the position of the camera directly.this is to ensure that different parts of the codebase modify the camera's position safely and predictably.trying to directly mutate its position in this code where the target variables are used will result in unexpected behaviour.i tried to diectly update the cam's position for zooming in and out where my code was relying on the target variables causing my effect to not apply properly
    private targetZ:number = -1;//this is used to offset the cam either forward or backward.i made it -0.6 initially cuz it starts as first person and ill want the cam to shift a little away from the model to clear the view
    private targetY:number = 0;

    private readonly toggleCooldown:seconds = 0.3; // Cooldown in seconds.this value in particular works the best
    private toggleTimer:seconds = 0;

    private readonly toggleItemGuiCooldown:seconds = 0.5;
    private toggleItemGuiTimer:seconds = 0;


    private playerHeight:number;

    public attackDamage:number;

    private attackCooldown:seconds = combatCooldown; // half a second cooldown
    private attackTimer:seconds = 0;

    public  knockback:number;
    private strength:number;

    private lookedAtEntity:EntityContract | null = null;
    private lookedAtItemClone:ItemClone | null = null;

    private respawnDelay:seconds = 7; // seconds
    private respawnTimer: seconds = 0;

    private showNonPlayerHealthTimer:seconds = 0;
    private readonly showNonPlayerHealthCooldown:seconds = 3;

    private readonly zoomDelta:number = 1;
    private readonly zoomClamp = 15

    private useItemCooldown:seconds = 0.5;
    private useItemTimer:seconds = 0;
    private itemHolder:ItemHolder;
    private lookRequest:LookRequest;
    private camForward:THREE.Vector3 = new THREE.Vector3();

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:PlayerMiscData) {
        super(fixedData,dynamicData);
        this.offsetY = (miscData.camArgs.offsetY=='auto')?fixedData.characterHeight+2:miscData.camArgs.offsetY;
        this.targetY = this.offsetY;
        this.camRotationSpeed = miscData.camArgs.cameraRotationSpeed;
        this.originalCamRotSpeed = miscData.camArgs.cameraRotationSpeed;
        this.camera = new Camera(miscData.camArgs);
        this.addObject(this.camera.cam3D);
        this.addObject(listener);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
        this.addEventListeners();
        this.health = new Health(miscData.healthValue);
        this.currentHealth = miscData.healthValue;
        this.playerHeight = fixedData.characterHeight;
        this.attackDamage = miscData.attackDamage;
        this.knockback = miscData.knockback;
        this.strength = miscData.strength;
        this.itemHolder = new ItemHolder(this.item3D);
        this.lookRequest = new LookRequest(new THREE.Vector2(0, 0)); // center of screen for forward raycast
    }
    private addEventListeners() {
        document.addEventListener('keydown',this.onPlayerKeyDown);
        document.addEventListener('keyup', this.onPlayerKeyUp);
    }
    private onPlayerKeyDown = (event:KeyboardEvent)=> {//i used an arrow function here to bind the this context
        this.keysPressed[event.code] = true;
    }
    private onPlayerKeyUp = (event:KeyboardEvent)=> {
        this.keysPressed[event.code] = false
    }
    private bindKeysToControls() {//i used keydown here for instant feedback and debounced some of them
        if (this.keysPressed['KeyP']) {
            console.log = ()=>{};
        }
        if (this.camModeNum == CameraMode.SecondPerson) {//inverted controls for second person
            if (!this.health.isDead) {
                if (this.keysPressed['KeyA']) {
                    this.moveCharacterRight();
                }
                if (this.keysPressed['KeyD']) {
                    this.moveCharacterLeft();
                }
            };
            if (this.keysPressed['ArrowUp']) {
                this.camera.rotateCameraDown(this.cameraClampAngle)
            };  
            if (this.keysPressed['ArrowDown']) {
                this.camera.rotateCameraUp(this.cameraClampAngle)
            };
        }else {//Normal WASD controls   
            if (!this.health.isDead) { 
                if (this.keysPressed['KeyA']) {
                    this.moveCharacterLeft();
                }
                if (this.keysPressed['KeyD']) {
                    this.moveCharacterRight();
                }
            }
            if (this.keysPressed['ArrowUp']) {
                this.camera.rotateCameraUp(this.cameraClampAngle)
            };  
            if (this.keysPressed['ArrowDown']) {
                this.camera.rotateCameraDown(this.cameraClampAngle)
            };
        }
        if (!this.health.isDead) {
            if (this.keysPressed['KeyW']) {
                if (this.keysPressed['ShiftLeft']) this.dynamicData.horizontalVelocity += 10;
                this.moveCharacterForward()
            }
            if (this.keysPressed['KeyS']) {
                this.moveCharacterBackward();
            }
            if (this.keysPressed['Space']) {
                this.moveCharacterUp()
            }
            if (this.keysPressed['KeyQ']) {
                this.attack();
            }
        }
        if (this.keysPressed['KeyR']) {
            if (this.toggleItemGuiTimer > this.toggleItemGuiCooldown) {
                toggleItemGui()
                this.toggleItemGuiTimer = 0;
            }
        }
        if (this.keysPressed['ArrowLeft'])  {
            this.rotateCharacterX('left')
        };  
        if (this.keysPressed['ArrowRight']) {
            this.rotateCharacterX('right')
        };
        
        const camPosToPlayer = this.camera.cam3D.getWorldPosition(new THREE.Vector3).clone().sub(this.position);
        const signedDist = Math.round(camPosToPlayer.dot(this.camForward));
        console.log('signedDist:', signedDist);
        
        if (this.keysPressed['Equal'] &&  (signedDist <= this.zoomClamp)) {//this corresponds to + key.zoom in
            this.zoomCamera(this.zoomDelta);
        }
        if (this.keysPressed['Minus'] && (signedDist >= -this.zoomClamp)) {//zoom out
            this.zoomCamera(-this.zoomDelta);
        }
        
        if (this.keysPressed['KeyT']) {//im allowing this one regardless of death state because it doesnt affect the charcater model in any way
            if (this.toggleTimer > this.toggleCooldown) { //this is a debouncing mechanism
                this.camModeNum = ((this.camModeNum<3)?this.camModeNum + 1:1) as 1 | 2 | 3;//this is to increase the camMode,when its 3rd person,reset it back to 1st person and repeat 
                this.toggleTimer = 0;
            }            
        }
        if (this.keysPressed['KeyE']) {
            if (this.useItemTimer > this.useItemCooldown) {
                this.useItemInHand();
                this.useItemTimer = 0
            }
        }
    }
    private useItemInHand() {
        const itemInHand = itemManager.itemInHand;
        if (itemInHand) {
            itemInHand.item.behaviour.use({
                view:this.camera.cam3D,
                itemID:itemInHand.itemID,
                userStrength:this.strength,
                userQuaternion:this.char.quaternion
            });
            setUsedItem(true);//update the gui to reflect changes like removing an item from the inv after using it
        }
    }
    private zoomCamera(zoomDelta:number) {
        const zoomDirection = this.camForward.clone().multiplyScalar(zoomDelta);
        const zoomPosition = this.camera.cam3D.position.clone().add(zoomDirection); // move forward
        this.targetY = zoomPosition.y;
        this.targetZ = zoomPosition.z
    }
    public requestLookedEntity():EntityContract | null {
        return this.lookRequest.requestObject({
            nativeCamera:this.camera.perspectiveCamera,
            testObjects:entities.map(e => e._entity.char),
            maxDistance:10,
            selection:entities
        })
    }
    public requestLookedItemClone():ItemClone | null {
        return this.lookRequest.requestObject({
            nativeCamera:this.camera.perspectiveCamera,
            testObjects:ItemClones.clones.map(clone=>clone.mesh),
            maxDistance:10,
            selection:ItemClones.clones
        })
    }
    private bindKeysToAnimations() {
        if (this.isAirBorne()) {
            this.stopWalkSound()
            this.playJumpAnimation()
        }else if (this.keysPressed['KeyW']) {//each key will have its own animation
            this.playWalkSound()
            this.playWalkAnimation()
        }else if (this.keysPressed['KeyA']) {
            this.playWalkSound()
        }else if (this.keysPressed['KeyS']) {
            this.playWalkSound()
        }else if (this.keysPressed['KeyD']) {
            this.playWalkSound()
        }else if (this.keysPressed['KeyQ']) {
            this.playAttackAnimation();
        }else if (!this.health.isDead) {
            this.stopWalkSound();
            this.playIdleAnimation();
        }
    }
    private toggleCamPerspective() {
        if ((this.keysPressed['KeyT'])) {
            this.targetY = this.offsetY;//reset the cam y position on toggling to cancel out the effect of zooming
            switch (this.camModeNum) {
                case CameraMode.FirstPerson: {
                    this.targetZ = -1//i used minus here because the forward direction is along the negative z axis
                    this.camRotationSpeed = this.originalCamRotSpeed
                    this.cameraClampAngle = this.firstPersonClamp
                    this.camera.setCameraRotationX(0,0);
                    break;
                }
                case CameraMode.SecondPerson: {
                    this.targetZ = -4;
                    this.camRotationSpeed = 1;
                    this.cameraClampAngle = this.secondPersonClamp
                    this.camera.setCameraRotationX(0,1);
                    break;
                }
                case CameraMode.ThirdPerson: {
                    this.targetZ = 6
                    this.cameraClampAngle = this.thirdPersonClamp;
                    this.camRotationSpeed = 1
                    this.camera.setCameraRotationX(0,0)
                }
            }
        }
    }

    private updateCamPosition() {
        const camPosition = this.camera.cam3D.position;
        const newCamPosition = new THREE.Vector3(camPosition.x,this.targetY,this.targetZ)
        this.camera.translateCamera(newCamPosition,0.2);
    }



    private updateHealthGUI() {
        console.log('Health. Player: ',this.health.value);
        setPlayerHealth({currentValue:this.health.value,maxValue:this.health.maxHealth});
        if (this.lookedAtEntity) {
            const entityHealth = this.lookedAtEntity._entity.health;
            setEntityHealth({currentValue:entityHealth.value,maxValue:entityHealth.maxHealth});
            setBlockDurability(null);//we dont want to show the block durability ui at the same time with the entity because they stay at the same position to preserve screen space
        }
        else if (this.lookedAtItemClone) {
            const durability = this.lookedAtItemClone.durability;
            setBlockDurability({currentValue:durability.value,maxValue:durability.maxHealth});
            setEntityHealth(null)
        }
        else if (this.showNonPlayerHealthTimer > this.showNonPlayerHealthCooldown) {
            setEntityHealth(null);
            setBlockDurability(null);
            this.showNonPlayerHealthTimer = 0;
        }
    }
    private attack() {
        if (this.attackTimer > (this.attackCooldown -0.4)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.playAttackAnimation();
        }
        if ((this.attackTimer > this.attackCooldown)){
            const srcPosition = this.position.clone();
            srcPosition.y *= -1;//i did this because the Y diff between the src position(player position) and the target is effectively zero here.This is because there is hardly any angular diff when a player hits a target up close.this means that there isnt any upward force that will be applied on the body because the src position is always facing horizontally forward to the target.so to work around this,i dragged the src position down so that the resulting impulse comes like an upper cut
            
            if (this.lookedAtEntity) { 
                console.log('attacked entity');
                const entity = this.lookedAtEntity._entity;
                const targetHealth = entity.health;
                if (targetHealth && !targetHealth.isDead) {    
                    targetHealth.takeDamage(this.attackDamage);
                    entity.knockbackCharacter(srcPosition,this.knockback);
                    this.addRelationship(entity,relationshipManager.enemyOf[groupIDs.player]);
                    this.addRelationship(this,relationshipManager.attackerOf[entity._groupID!]);
                    this.attackTimer = 0;
                }
            }else if (this.lookedAtItemClone) {
                console.log('attacked block');
                const targetDurability = this.lookedAtItemClone.durability;
                if (!targetDurability.isDead) {
                    targetDurability.takeDamage(this.attackDamage);
                    this.lookedAtItemClone.applyKnockback(srcPosition,this.strength);
                    console.log('targetDurability:', targetDurability.value);
                    this.attackTimer = 0;
                }
            }
        }
    }
    private checkIfOutOfBounds() {
        if (this.isOutOfBounds) {
            this.health.takeDamage(this.health.value);//kill the player
        }
    }
    private handleRespawn() {
        if (this.health.isDead) {
            this.respawnTimer += this.clockDelta || 0;
            if (this.respawnTimer >= this.respawnDelay) {
                this.respawn();
                this.health.revive();
                this.respawnTimer = 0;
                this.targetY = this.offsetY;
            }
        }
    }
    private updateCameraHeightBasedOnHealth() {
        if (this.health.isDead) {
            this.targetY = this.offsetY - this.playerHeight;
            this.playDeathAnimation();
        }
    }
    get _groupID():string {
        return this.groupID;
    }
    private lastPosition:THREE.Vector3 = new THREE.Vector3();
    private changedPosition:boolean = false;

    private lastQuaternion:THREE.Quaternion = new THREE.Quaternion();
    private changedQuaternion:boolean = false;

    //the last AND condition is to ensure that the placement helper is only generated if the player's position or rotation has changed.this preserves perf by ensuring that its only regenerated when the player actually moves
    private showPlacementHelper() {
        const itemBody = itemManager.itemInHand?.item.behaviour.itemBody
        const showPlacementHelper = itemBody?.showPlacementHelper;
        console.log('holding has changed item: ',this.itemHolder.hasChangedHeldItem);

        if (showPlacementHelper && (this.changedPosition || this.changedQuaternion)) {
            console.log('placement created');
            const placementBox = createBoxLine(itemBody.width,itemBody.height,itemBody.depth);
            placementBox.position.copy(ItemUtils.getSpawnPosition(this.camera.cam3D,spawnDistance));
            placementBox.quaternion.copy(this.char.quaternion);
            placementHelper.add(placementBox);
        }
        this.lastPosition.copy(this.position);
        this.lastQuaternion.copy(this.camera.cam3D.getWorldQuaternion(new THREE.Quaternion))
    }
    private updateHasChangedVariables() {
        this.changedPosition = !this.lastPosition.equals(this.position);
        this.changedQuaternion = !this.lastQuaternion.equals(this.camera.cam3D.getWorldQuaternion(new THREE.Quaternion));
        console.log('placement compare pos: ',this.changedPosition);
        console.log('placement compare quat: ',this.changedQuaternion);
    }
    private clearPlacementHelper() {
        if ((this.changedPosition || this.changedQuaternion) || (isCellSelected())) {
            console.log('placement cleared');
            disposeHierarchy(placementHelper);//onl
            placementHelper.clear();
        }
    }
    //a partial part of the order of updates here are critical.this means that some updates must come before others for correctness
    protected onLoop() {//this is where all character updates to this instance happens.
        this.updateHasChangedVariables();//this one must be called before clearing the placement helper so that it receives the latest state before use
        this.clearPlacementHelper();//we want to clear the helper in the frame after rendering the helper to prevent it from clearing prematurely which is why i cleared it at the top befor rendering the helper

        this.toggleTimer += this.clockDelta || 0;
        this.toggleItemGuiTimer += this.clockDelta || 0;
        this.showNonPlayerHealthTimer += this.clockDelta || 0;
        this.attackTimer += this.clockDelta || 0;
        this.useItemTimer += this.clockDelta || 0;
        this.currentHealth = this.health.value;

        this.lookedAtEntity = this.requestLookedEntity();
        this.lookedAtItemClone = this.requestLookedItemClone();
        
        this.camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.cam3D.getWorldQuaternion(new THREE.Quaternion));

        this.itemHolder.holdItem(itemManager.itemInHand?.item || null);
        this.showPlacementHelper();

        //these ones arent sensitive to order of operations
        this.checkIfOutOfBounds();
        this.updateHealthGUI();
        this.health.checkGroundDamage(this.velBeforeHittingGround);
        if (!isCellSelected()) this.bindKeysToControls();//this is to prevent the player's event listeners on his character from triggering when the player is actively traversing through the item grid to select an item
        console.log('isCellSelected:', isCellSelected());
        this.bindKeysToAnimations();
        this.toggleCamPerspective();
        this.updateCamPosition();
        this.updateCameraHeightBasedOnHealth();
        this.handleRespawn();
        this.camera.updateCamera(this.camRotationSpeed);
    }
}
//Note:This is the only place where ill load gltf models async.the rest of my codebase will use sync loading with callback management to ensure that the models are prepared before use.the reason why i did this for the rest of the codebase is because i dont want the use of a single await to propagate all of my ethods to be async.i want everything to remain as sync methods to reduce verbosity and clear predictability in control flow.the only reason why i used await here is because await at the top level doesnt cause async propagation and unlike the rest of my code that loads gltf models,i dont really have a way to time this one properly because a bug part of my code is reliant on the player and i need to ensure that the player is ready before demand.i tried to do a player factory to do this like the way i did it for my entity factory but that didnt work.it has to be fully prepared on export.
const playerFixedData:FixedControllerData = {
    gltfModel:await gltfLoader.loadAsync('./snowman-v3.glb'),
    spawnPoint: new RAPIER.Vector3(0,30,0),
    characterHeight:2,
    characterWidth:1,
    shape:'capsule',
    density:1,
}
const playerDynamicData:DynamicControllerData = {
    horizontalVelocity:20,
    jumpVelocity:30,
    jumpResistance:30,
    rotationDelta:0.04,//in radians
    rotationSpeed:0.4,
    maxStepUpHeight:2.5,
    gravityScale:1
}
const playerMiscData:PlayerMiscData = {
    healthValue:1000,
    attackDamage:1,
    knockback:200,
    strength:1000,
    camArgs: {
        FOV:75,
        nearPoint:0.1,
        farPoint:1000,
        cameraRotationDelta:1,//in degrees
        cameraRotationSpeed:0.5,
        offsetY:'auto'
    }
}
export const player = new Player(playerFixedData,playerDynamicData,playerMiscData);