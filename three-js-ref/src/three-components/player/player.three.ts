import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { Health } from "../health/health";
import { Entity } from "../entity/entity.three";
import { entities } from "../scene.three";

// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    cameraRotationSpeed:number;
    offsetY:number | 'auto';
}
interface PlayerMiscData {
    camArgs:PlayerCamData
    healthValue:number,
    attackDamage:number
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

    public health:Health;
    public  camera:Camera;

    private camModeNum:1 | 2 | 3 = 1;//this corresponds to first,second and third person views

    private camRotationSpeed:number;
    private originalCamRotSpeed:number

    private offsetY:number;
    private targetZ:number = 0;//the 0 is just for initialization sake so ts wont complain but it will be changed correctly during the render loop
    private targetY:number = 0;

    private toggleCooldown: number = 0.3; // Cooldown in seconds.this value in particular works the best
    private lastToggleTime: number = 0;

    private isRespawning: boolean = false;
    private respawnDelay: number = 10; // seconds
    private respawnTimer: number = 0;

    private playerHeight:number;

    private attackDamage:number;
    private raycaster = new THREE.Raycaster();
    private lookDirection = new THREE.Vector2(0, 0); // center of screen for forward raycast

    private attackCooldown = 0.5; // half a second cooldown
    private attackTimer = 0;

    private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
        let current = child;
        while (current) {
            if (current === parent) return true;
            current = current.parent!;
        }
        return false;
    }
    public getLookedAtEntityHealth(entities:Entity[], maxDistance = 10): Health | null {
        this.raycaster.setFromCamera(this.lookDirection, this.camera.perspectiveCamera);
        const objectsToTest = entities.map(e => e.controller); // implement getRootObject() to return THREE.Object3D of entity
        const intersects = this.raycaster.intersectObjects(objectsToTest, true);
        
        if (intersects.length > 0 && intersects[0].distance <= maxDistance) {
            const intersectedObject = intersects[0].object;// Find which entity corresponds to the intersected object
            for (const entity of entities) {
                if (this.isDescendantOf(intersectedObject, entity.controller)) {
                    return entity.health;
                }
            }
        }
        return null;
    }
    private attack(entities: Entity[]) {
        if (this.attackTimer < this.attackCooldown) return;
        const targetHealth = this.getLookedAtEntityHealth(entities, 10);
        if (targetHealth && !targetHealth.isDead) {
            targetHealth.takeDamage(this.attackDamage);
            this.attackTimer = 0;
        }
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
    }
    private displayHealth() {
        console.log('Health. Player: ',this.health.value);
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
        if (this.camModeNum == CameraMode.SecondPerson) {//inverted controls for second person
            if (!this.health.isDead) {
                if (Player.keysPressed['KeyA']) {
                    this.moveCharacterRight();
                }
                if (Player.keysPressed['KeyD']) {
                    this.moveCharacterLeft();
                }
            }
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
            if (Player.keysPressed['KeyP']) {
                console.log = ()=>{};
            }
            if (Player.keysPressed['Space']) {
                this.moveCharacterUp()
            }
            if (Player.keysPressed['ArrowLeft'])  {
                this.rotateCharacterX('left')
            };  
            if (Player.keysPressed['ArrowRight']) {
                this.rotateCharacterX('right')
            };
            if (Player.keysPressed['KeyQ']) {
                this.attack(entities);
            }
        }
        if (Player.keysPressed['KeyT']) {//im allowing this one regardless of death state because it doesnt affect the charcater model in any way
            if ((this.lastToggleTime + this.toggleCooldown) <= this.clock.elapsedTime) { //this is a debouncing mechanism
                this.camModeNum = ((this.camModeNum<3)?this.camModeNum + 1:1) as 1 | 2 | 3;//this is to increase the camMode,when its 3rd person,reset it back to 1st person and repeat 
                this.lastToggleTime = this.clock.elapsedTime
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
        }else {
            this.stopWalkSound()
            this.playIdleAnimation()
        }
    }
    private toggleCamPerspective() {
        if ((Player.keysPressed['KeyT'])) {
            switch (this.camModeNum) {
                case CameraMode.FirstPerson: {
                    this.targetZ = 0;
                    this.camRotationSpeed = this.originalCamRotSpeed
                    this.cameraClampAngle = this.firstPersonClamp
                    this.camera.setCameraRotationX(0,0);
                    break;
                }
                case CameraMode.SecondPerson: {
                    this.targetZ = -35;
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
        } else {
            this.targetY = this.offsetY;
        }
    }
    protected onLoop() {//this is where all character updates to this instance happens.
        this.attackTimer += this.clockDelta || 0;
        this.displayHealth();
        this.updateCameraHeightBasedOnHealth();
        this.handleRespawn();
        this.bindKeysToControls();
        this.bindKeysToAnimations();
        this.toggleCamPerspective();
        this.updateCamPosition();
        this.camera.updateCamera(this.camRotationSpeed);
    }
}

const playerFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
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
    healthValue:10,
    attackDamage:1,
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