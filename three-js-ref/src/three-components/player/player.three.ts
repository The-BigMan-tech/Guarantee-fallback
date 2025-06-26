import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"

// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    offsetY:number | 'auto';
}
class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private firstPersonClamp = 75;
    private thirdPersonClamp = 10;
    private cameraClampAngle:number =  this.firstPersonClamp;

    public camera:Camera;
    private canToggleCamera:boolean = true;//to debounce perspective toggling
    private camMode = 1

    private offsetY:number;
    private targetZ:number = 0;//the 0 is just for initialization sake so ts wont complain but it will be changed correctly during the render loop
    private targetY:number = 0;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,camArgs:PlayerCamData) {
        super(fixedData,dynamicData);
        this.offsetY = (camArgs.offsetY=='auto')?fixedData.characterHeight+2:camArgs.offsetY
        this.camera = new Camera(camArgs)
        this.addObject(this.camera.cam3D);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
        Player.addEventListeners()
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
        if (Player.keysPressed['Space']) {
            this.moveCharacterUp()
        }
        if (Player.keysPressed['KeyW']) {
            if (Player.keysPressed['ShiftLeft']) this.dynamicData.horizontalVelocity += 10;
            this.moveCharacterForward()
        }
        if (Player.keysPressed['KeyS']) {
            this.moveCharacterBackward();
        }
        if (Player.keysPressed['KeyA']) {
            this.moveCharacterLeft();
        }
        if (Player.keysPressed['KeyD']) {
            this.moveCharacterRight();
        }
        if (Player.keysPressed['ArrowLeft'])  {
            this.rotateCharacterX(-1)
        };  
        if (Player.keysPressed['ArrowRight']) {
            this.rotateCharacterX(+1)
        };
        if (Player.keysPressed['ArrowUp']) {
            this.camera.rotateCameraUp(this.cameraClampAngle)
        };  
        if (Player.keysPressed['ArrowDown']) {
            this.camera.rotateCameraDown(this.cameraClampAngle)
        };
        if (Player.keysPressed['KeyT']) {
            if (this.canToggleCamera) { 
                if (this.camMode==3) {
                    this.camMode = 1
                }else {
                    this.camMode += 1;
                }
                this.canToggleCamera = false;  // prevent further toggles until key released
            }
        }else this.canToggleCamera = true;  // reset when key released
    }
    private bindKeysToAnimations() {
        if (this.isAirBorne()) {
            this.stopWalkSound()
            this.playJumpAnimation()
            if (this.camMode == 0) {
                this.targetZ = -0.5;
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
    private toggleThirdPerson() {//this is where the camera is updated and optionally adding other behaviour to the camera before that update
        if (this.camMode == 3) {
            this.cameraClampAngle = this.thirdPersonClamp
            this.targetZ = 6
            this.targetY = this.offsetY
        }else if (this.camMode == 2){
            this.cameraClampAngle = this.thirdPersonClamp
            this.targetZ = -6
            this.targetY = this.offsetY;
        }else if (this.camMode == 1){
            this.cameraClampAngle = this.firstPersonClamp
            this.targetZ = 0
            this.targetY = this.offsetY
        }
    }
    private updateCamPosition() {
        const camPosition = this.camera.cam3D.position;
        const newCamPosition = new THREE.Vector3(camPosition.x,this.targetY,this.targetZ)
        this.camera.translateCamera(newCamPosition,0.2);
    }
    protected onLoop() {//this is where all character updates to this instance happens.
        this.toggleThirdPerson();
        this.bindKeysToControls();
        this.bindKeysToAnimations();
        this.updateCamPosition();
        this.camera.updateCamera();
    }
}
const PlayerCamArgs:PlayerCamData = {
    FOV:75,
    nearPoint:0.1,
    farPoint:1000,
    cameraRotationDelta:0.05,
    cameraRotationSpeed:0.5,
    offsetY:'auto'
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
    horizontalVelocity:30,
    jumpVelocity:30,
    jumpResistance:15,
    rotationDelta:0.04,
    rotationSpeed:0.4,
    maxStepUpHeight:2,
    gravityScale:1
}
export const player = new Player(playerFixedData,playerDynamicData,PlayerCamArgs)