import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"

// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    cameraRotationSpeed:number;
    offsetY:number | 'auto';
}
const cameraModeMap = new Map<number, string>([
    [1, "FirstPerson"],
    [2, "SecondPerson"],
    [3, "ThirdPerson"]
]);

class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private firstPersonClamp = 75;
    private thirdPersonClamp = 10;
    private cameraClampAngle:number =  this.firstPersonClamp;

    public camera:Camera;
    private canToggleCamera:boolean = true;//to debounce perspective toggling

    private camModeNum:1 | 2 | 3 = 1;//this corresponds to first,second and third person views

    private camRotationSpeed:number;
    private originalCamRotSpeed:number

    private offsetY:number;
    private targetZ:number = 0;//the 0 is just for initialization sake so ts wont complain but it will be changed correctly during the render loop
    private targetY:number = 0;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,camArgs:PlayerCamData) {
        super(fixedData,dynamicData);
        this.offsetY = (camArgs.offsetY=='auto')?fixedData.characterHeight+2:camArgs.offsetY;
        this.targetY = this.offsetY;
        this.camRotationSpeed = camArgs.cameraRotationSpeed;
        this.originalCamRotSpeed = camArgs.cameraRotationSpeed;
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
                this.camModeNum = ((this.camModeNum<3)?this.camModeNum + 1:1) as 1 | 2 | 3;//this is to increase the camMode,when its 3rd person,reset it back to 1st person and repeat 
                this.canToggleCamera = false;  // prevent further toggles until key released
            }
        }else this.canToggleCamera = true;  // reset when key released
    }
    private bindKeysToAnimations() {
        if (this.isAirBorne()) {
            this.stopWalkSound()
            this.playJumpAnimation()
            switch (cameraModeMap.get(this.camModeNum)) {
                case "FirstPerson": this.targetZ = -0.5;
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
        switch (cameraModeMap.get(this.camModeNum)) {
            case "FirstPerson": {
                this.targetZ = 0;
                this.camRotationSpeed = this.originalCamRotSpeed
                this.cameraClampAngle = this.firstPersonClamp
                this.camera.setCameraRotationX(0,0);
                break;
            }
            case "SecondPerson": {
                this.targetZ = -6;
                this.camRotationSpeed = 1;
                this.camera.setCameraRotationX(0,1);
                break;
            }
            case "ThirdPerson": {
                this.targetZ = 6
                this.cameraClampAngle = this.thirdPersonClamp;
                this.camRotationSpeed = 1
                this.camera.setCameraRotationX(0,0)
            }
        }
    }
    private updateCamPosition() {
        const camPosition = this.camera.cam3D.position;
        const newCamPosition = new THREE.Vector3(camPosition.x,this.targetY,this.targetZ)
        this.camera.translateCamera(newCamPosition,0.2);
    }
    protected onLoop() {//this is where all character updates to this instance happens.
        this.bindKeysToControls();
        this.bindKeysToAnimations();
        this.toggleCamPerspective();
        this.updateCamPosition();
        this.camera.updateCamera(this.camRotationSpeed);
    }
}
const PlayerCamArgs:PlayerCamData = {
    FOV:75,
    nearPoint:0.1,
    farPoint:1000,
    cameraRotationDelta:3,//in degrees
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
    horizontalVelocity:25,
    jumpVelocity:35,
    jumpResistance:15,
    rotationDelta:0.04,//in radians
    rotationSpeed:0.4,
    maxStepUpHeight:2,
    gravityScale:1
}
export const player = new Player(playerFixedData,playerDynamicData,PlayerCamArgs)