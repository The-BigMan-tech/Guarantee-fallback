import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { Health } from "../health/health";
import { type EntityContract } from "../entity-system/entity.three";
import { entities } from "../entity-system/entity.three";
import { combatCooldown } from "../physics-world.three";
import { setEntityHealth, setPlayerHealth } from "../health/health-state";
import { listener } from "../listener/listener.three";
import type { EntityLike } from "../entity-system/relationships.three";
import { groupIDs } from "../entity-system/globals";
import { relationshipManager } from "../entity-system/relationships.three";
import type { seconds } from "../entity-system/globals";
import { toggleItemGui,isCellSelected } from "../item-system/item-state";
import { itemManager } from "../item-system/item-manager.three";
import { disposeHierarchy } from "../disposer/disposer.three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    cameraRotationSpeed:number;
    offsetY:number | 'auto';
}
interface PlayerMiscData {
    camArgs:PlayerCamData
    healthValue:number,
    attackDamage:number,
    knockback:number
}
enum CameraMode {
    FirstPerson = 1,
    SecondPerson = 2,
    ThirdPerson = 3
}

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
    private targetZ:number = -0.6;//this is used to offset the cam either forward or backward.i made it -0.6 initially cuz it starts as first person and ill want the cam to shift a little away from the model to clear the view
    private targetY:number = 0;

    private readonly toggleCooldown:seconds = 0.3; // Cooldown in seconds.this value in particular works the best
    private toggleTimer:seconds = 0;

    private readonly toggleItemGuiCooldown:seconds = 0.5;
    private toggleItemGuiTimer:seconds = 0;


    private playerHeight:number;

    public attackDamage:number;
    private raycaster = new THREE.Raycaster();
    private lookDirection = new THREE.Vector2(0, 0); // center of screen for forward raycast

    private attackCooldown:seconds = combatCooldown; // half a second cooldown
    private attackTimer:seconds = 0;

    public knockback:number;
    private lookedAtEntity:EntityContract | null = null;

    private respawnDelay:seconds = 7; // seconds
    private respawnTimer: seconds = 0;

    private showEntityHealthTimer:seconds = 0;
    private readonly showEntityHealthCooldown:seconds = 3;

    private readonly zoomDelta:number = 1;
    private readonly zoomClamp = 15

    private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
        let current = child;
        while (current) {
            if (current === parent) return true;
            current = current.parent!;
        }
        return false;
    }
    private getTheLookedAtEntity(entities:EntityContract[], maxDistance = 10):EntityContract | null {
        this.raycaster.setFromCamera(this.lookDirection, this.camera.perspectiveCamera);
        const objectsToTest = entities.map(e => e._entity.char); // implement getRootObject() to return THREE.Object3D of entity
        const intersects = this.raycaster.intersectObjects(objectsToTest, true);
        
        if (intersects.length > 0 && intersects[0].distance <= maxDistance) {
            const intersectedObject = intersects[0].object;// Find which entity corresponds to the intersected object
            for (const entity of entities) {
                if (this.isDescendantOf(intersectedObject, entity._entity.char)) {
                    return entity;
                }
            }
        }
        return null;
    }

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:PlayerMiscData) {
        super(fixedData,dynamicData);
        this.offsetY = (miscData.camArgs.offsetY=='auto')?fixedData.characterHeight+2:miscData.camArgs.offsetY;
        this.targetY = this.offsetY;
        this.camRotationSpeed = miscData.camArgs.cameraRotationSpeed;
        this.originalCamRotSpeed = miscData.camArgs.cameraRotationSpeed;
        this.camera = new Camera(miscData.camArgs);
        this.addObject(this.camera.cam3D);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
        this.addObject(listener);
        this.addEventListeners();
        this.health = new Health(miscData.healthValue);
        this.currentHealth = miscData.healthValue;
        this.playerHeight = fixedData.characterHeight;
        this.attackDamage = miscData.attackDamage;
        this.knockback = miscData.knockback;
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
        if (this.keysPressed['KeyE']) {
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
        
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.cam3D.quaternion);
        const camPosToPlayer = this.camera.cam3D.position.clone().sub(this.position);
        const signedDist = camPosToPlayer.dot(camForward);
        
        if (this.keysPressed['Equal'] &&  (signedDist <= this.zoomClamp)) {//this corresponds to + key.zoom in
            this.zoomCamera(this.zoomDelta,camForward);
        }
        if (this.keysPressed['Minus'] && (signedDist >= -this.zoomClamp)) {//zoom out
            this.zoomCamera(-this.zoomDelta,camForward);
        }
        
        if (this.keysPressed['KeyT']) {//im allowing this one regardless of death state because it doesnt affect the charcater model in any way
            if (this.toggleTimer > this.toggleCooldown) { //this is a debouncing mechanism
                this.camModeNum = ((this.camModeNum<3)?this.camModeNum + 1:1) as 1 | 2 | 3;//this is to increase the camMode,when its 3rd person,reset it back to 1st person and repeat 
                this.toggleTimer = 0;
            }            
        }
    }
    private zoomCamera(zoomDelta:number,camForward:THREE.Vector3) {
        const zoomDirection = camForward.clone().multiplyScalar(zoomDelta);
        const zoomPosition = this.camera.cam3D.position.clone().add(zoomDirection); // move forward
        this.targetY = zoomPosition.y;
        this.targetZ = zoomPosition.z
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
                    this.targetZ = -1;
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
        this.lookedAtEntity = this.getTheLookedAtEntity(entities, 10);
        setPlayerHealth({currentValue:this.health.value,maxValue:this.health.maxHealth});
        if (this.lookedAtEntity) {
            const entityHealth = this.lookedAtEntity._entity.health;
            setEntityHealth({currentValue:entityHealth.value,maxValue:entityHealth.maxHealth})
        }else if (this.showEntityHealthTimer > this.showEntityHealthCooldown) {
            setEntityHealth(null);
            this.showEntityHealthTimer = 0;
        }
    }
    private attack() {
        if (this.attackTimer > (this.attackCooldown -0.4)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.playAttackAnimation();
        }
        if ((this.attackTimer > this.attackCooldown) && (this.lookedAtEntity)) { 
            const entity = this.lookedAtEntity._entity;
            const targetHealth = entity.health;
            if (targetHealth && !targetHealth.isDead) {
                targetHealth.takeDamage(this.attackDamage);
                entity.knockbackCharacter('backwards',this.knockback);
                this.addRelationship(entity,relationshipManager.enemyOf[groupIDs.player]);
                this.addRelationship(this,relationshipManager.attackerOf[entity._groupID!]);
                this.attackTimer = 0;
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


    private currentHeldItemID: string | null = null;
    private modelLoader:GLTFLoader = new GLTFLoader();

    private disposeItem() {
        while (this.item3D.children.length > 0) {
            const child = this.item3D.children[0];
            this.item3D.remove(child);
            disposeHierarchy(child); // Dispose the removed child's geometry/materials/textures etc.
        }
    }

    private loadItemModel(model:THREE.Group) {
        this.disposeItem(); // Remove previous model from item3D
        const clonedModel = model.clone(true); // Deep clone
        clonedModel.scale.set(0.5, 0.5, 0.5); // Scale to 50% in all dimensions
        const offset = { position: new THREE.Vector3(0,0,1), rotation: new THREE.Euler(0,0,0) };
        clonedModel.position.copy(offset.position);
        clonedModel.rotation.copy(offset.rotation);
        this.item3D.add(clonedModel);// Clone before adding
    }

    private holdSelectedItem() {//called on loop
        const itemInHand = itemManager.itemInHand;
        const heldItemID = itemInHand ? itemInHand.item.name : null;
        if (heldItemID !== this.currentHeldItemID) {
            this.currentHeldItemID = heldItemID;
            console.log('holding currentHeldItemID:',this.currentHeldItemID);
            if (!itemInHand) {
                this.disposeItem();
                return
            }
            if (itemInHand.item.scene) {
                console.log('used item scene');
                this.loadItemModel(itemInHand.item.scene)
                return
            }else {
                this.modelLoader.load(itemInHand.item.modelPath,
                    gltf=>{
                        itemInHand.item.scene = gltf.scene;
                        this.loadItemModel(itemInHand.item.scene)
                    }
                );
            }
        }
    }

    protected onLoop() {//this is where all character updates to this instance happens.
        this.toggleTimer += this.clockDelta || 0;
        this.toggleItemGuiTimer += this.clockDelta || 0;
        this.showEntityHealthTimer += this.clockDelta || 0;
        this.attackTimer += this.clockDelta || 0;
        this.currentHealth = this.health.value;
        this.holdSelectedItem();
        this.checkIfOutOfBounds();
        this.updateHealthGUI();
        this.health.checkGroundDamage(this.velBeforeHittingGround);
        if (!isCellSelected()) this.bindKeysToControls();//this is to prevent the player's event listeners on his character from triggering when the player is actively traversing through the item grid to select an item
        console.log('isCellSelected:', isCellSelected());
        this.bindKeysToAnimations();
        this.toggleCamPerspective();
        this.updateCamPosition();
        this.camera.updateCamera(this.camRotationSpeed);
        this.updateCameraHeightBasedOnHealth();
        this.handleRespawn();
    }
}

const playerFixedData:FixedControllerData = {
    modelPath:'./snowman-v3.glb',
    spawnPoint: new RAPIER.Vector3(0,30,0),
    characterHeight:2,
    characterWidth:1,
    shape:'capsule',
    mass:40,
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
    knockback:150,
    camArgs: {
        FOV:75,
        nearPoint:0.1,
        farPoint:1000,
        cameraRotationDelta:1,//in degrees
        cameraRotationSpeed:0.5,
        offsetY:'auto'
    }
}
export const player = new Player(playerFixedData,playerDynamicData,playerMiscData)