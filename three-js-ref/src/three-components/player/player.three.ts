import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { Health } from "../health/health";
import { type EntityContract } from "../entity/entity.three";
import { entities } from "../entity/entity.three";
import { combatCooldown } from "../physics-world.three";
import { setEntityHealth, setPlayerHealth } from "../health/health-state";

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
class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    
    private firstPersonClamp = 75;
    private secondPersonClamp = 70;
    private thirdPersonClamp = 10;
    private cameraClampAngle:number =  this.firstPersonClamp;

    public  health:Health;
    public  camera:Camera;

    private camModeNum:1 | 2 | 3 = 1;//this corresponds to first,second and third person views

    private camRotationSpeed:number;
    private originalCamRotSpeed:number

    private offsetY:number;
    private targetZ:number = -0.6;//this is used to offset the cam either forward or backward.i made it -0.6 initially cuz it starts as first person and ill want the cam to shift a little away from the model to clear the view
    private targetY:number = 0;

    private toggleCooldown: number = 0.3; // Cooldown in seconds.this value in particular works the best
    private toggleTimer: number = 0;

    private isRespawning: boolean = false;
    private respawnDelay: number = 7; // seconds
    private respawnTimer: number = 0;

    private playerHeight:number;

    private attackDamage:number;
    private raycaster = new THREE.Raycaster();
    private lookDirection = new THREE.Vector2(0, 0); // center of screen for forward raycast

    private attackCooldown = combatCooldown; // half a second cooldown
    private attackTimer = 0;

    private knockback:number;
    private lookedAtEntity:EntityContract | null = null;

    private showEntityHealthTimer:number = 0;
    private showEntityHealthCooldown:number = 3;

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
        this.camera = new Camera(miscData.camArgs)
        this.addObject(this.camera.cam3D);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
        Player.addEventListeners();
        this.health = new Health(miscData.healthValue);
        this.playerHeight = fixedData.characterHeight;
        this.attackDamage = miscData.attackDamage;
        this.knockback = miscData.knockback;
    }
    private updateHealthGUI() {
        console.log('Health. Player: ',this.health.value);
        this.lookedAtEntity = this.getTheLookedAtEntity(entities, 10);
        setPlayerHealth({currentValue:this.health.value,maxValue:this.health.maxHealth});
        if (this.lookedAtEntity) {
            const entityHealth = this.lookedAtEntity._entity.health;
            console.log('entityHealth:', entityHealth);
            setEntityHealth({currentValue:entityHealth.value,maxValue:entityHealth.maxHealth})
        }else if (this.showEntityHealthTimer > this.showEntityHealthCooldown) {
            setEntityHealth(null);
            this.showEntityHealthTimer = 0;
        }
    }
    private static addEventListeners() {
        document.addEventListener('keydown',Player.onKeyDown);
        document.addEventListener('keyup', Player.onKeyUp);
    }
    private static onKeyDown(event:KeyboardEvent) {
        Player.keysPressed[event.code] = true;
    }
    private static onKeyUp(event:KeyboardEvent) {
        Player.keysPressed[event.code] = false
    }
    private bindKeysToControls() {
        if (Player.keysPressed['KeyP']) {
            console.log = ()=>{};
        }
        if (this.camModeNum == CameraMode.SecondPerson) {//inverted controls for second person
            if (!this.health.isDead) {
                if (Player.keysPressed['KeyA']) {
                    this.moveCharacterRight();
                }
                if (Player.keysPressed['KeyD']) {
                    this.moveCharacterLeft();
                }
            };
            if (Player.keysPressed['ArrowUp']) {
                this.camera.rotateCameraDown(this.cameraClampAngle)
            };  
            if (Player.keysPressed['ArrowDown']) {
                this.camera.rotateCameraUp(this.cameraClampAngle)
            };
        }else {//Normal WASD controls   
            if (!this.health.isDead) { 
                if (Player.keysPressed['KeyA']) {
                    this.moveCharacterLeft();
                }
                if (Player.keysPressed['KeyD']) {
                    this.moveCharacterRight();
                }
            }
            if (Player.keysPressed['ArrowUp']) {
                this.camera.rotateCameraUp(this.cameraClampAngle)
            };  
            if (Player.keysPressed['ArrowDown']) {
                this.camera.rotateCameraDown(this.cameraClampAngle)
            };
        }
        if (!this.health.isDead) {
            if (Player.keysPressed['KeyW']) {
                if (Player.keysPressed['ShiftLeft']) this.dynamicData.horizontalVelocity += 10;
                this.moveCharacterForward()
            }
            if (Player.keysPressed['KeyS']) {
                this.moveCharacterBackward();
            }
            if (Player.keysPressed['Space']) {
                this.moveCharacterUp()
            }
            if (Player.keysPressed['KeyQ']) {
                this.attack();
            }
        }
        if (Player.keysPressed['ArrowLeft'])  {
            this.rotateCharacterX('left')
        };  
        if (Player.keysPressed['ArrowRight']) {
            this.rotateCharacterX('right')
        };
        if (Player.keysPressed['KeyT']) {//im allowing this one regardless of death state because it doesnt affect the charcater model in any way
            if (this.toggleTimer > this.toggleCooldown) { //this is a debouncing mechanism
                this.camModeNum = ((this.camModeNum<3)?this.camModeNum + 1:1) as 1 | 2 | 3;//this is to increase the camMode,when its 3rd person,reset it back to 1st person and repeat 
                this.toggleTimer = 0
            }            
        }
    }
    private bindKeysToAnimations() {
        if (this.isAirBorne()) {
            this.stopWalkSound()
            this.playJumpAnimation()
            switch (this.camModeNum) {
                case CameraMode.FirstPerson: this.targetZ = -0.6;
            }
        }else if (Player.keysPressed['KeyW']) {//each key will have its own animation
            this.playWalkSound()
            this.playWalkAnimation()
        }else if (Player.keysPressed['KeyA']) {
            this.playWalkSound()
        }else if (Player.keysPressed['KeyS']) {
            this.playWalkSound()
        }else if (Player.keysPressed['KeyD']) {
            this.playWalkSound()
        }else if (Player.keysPressed['KeyQ']) {
            this.playAttackAnimation();
        }else if (!this.health.isDead) {
            this.stopWalkSound();
            this.playIdleAnimation();
        }
    }
    private toggleCamPerspective() {
        if ((Player.keysPressed['KeyT'])) {
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


    private attack() {
        if (this.attackTimer > (this.attackCooldown -0.4)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.playAttackAnimation();
        }
        if (this.attackTimer > this.attackCooldown) { 
            if (this.lookedAtEntity) {
                const targetHealth = this.lookedAtEntity._entity.health;
                if (targetHealth && !targetHealth.isDead) {
                    targetHealth.takeDamage(this.attackDamage);
                    this.lookedAtEntity._entity.knockbackCharacter('backwards',this.knockback);
                    this.attackTimer = 0;
                }
            }
        }
    }
    private handleRespawn() {
        if (this.health.isDead && !this.isRespawning) {
            this.isRespawning = true;
            this.respawnTimer = 0;
        }
        if (this.isRespawning) {
            this.respawnTimer += this.clockDelta || 0;
            if (this.respawnTimer >= this.respawnDelay) {
                this.respawn();
                this.health.revive();
                this.isRespawning = false;
            }
        }
    }
    private updateCameraHeightBasedOnHealth() {
        if (this.health.isDead) {
            this.targetY = this.offsetY - this.playerHeight;
            this.playDeathAnimation();
        } else {
            this.targetY = this.offsetY;
        }
    }
    protected onLoop() {//this is where all character updates to this instance happens.
        this.toggleTimer += this.clockDelta || 0;
        this.showEntityHealthTimer += this.clockDelta || 0;
        this.attackTimer += this.clockDelta || 0;
        this.updateHealthGUI();
        this.health.checkGroundDamage(this.velBeforeHittingGround);
        this.bindKeysToControls();
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
    spawnPoint: new RAPIER.Vector3(0,20,0),
    characterHeight:2,
    characterWidth:1,
    shape:'capsule',
    mass:40,
}
const playerDynamicData:DynamicControllerData = {
    horizontalVelocity:25,
    jumpVelocity:30,
    jumpResistance:30,
    rotationDelta:0.04,//in radians
    rotationSpeed:0.4,
    maxStepUpHeight:2,
    gravityScale:1
}
const playerMiscData:PlayerMiscData = {
    healthValue:40,
    attackDamage:1,
    knockback:1000,
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