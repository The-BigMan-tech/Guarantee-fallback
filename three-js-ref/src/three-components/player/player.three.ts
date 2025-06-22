import { Camera, type CameraData } from "./camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"


class Player extends Controller {
    public camera:Camera;
    private camPosition:THREE.Vector3;
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private canToggleCamera:boolean;
    private isThirdPerson:boolean;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
        this.camera = new Camera(PlayerCamArgs)
        this.addObject(this.camera.cam3D);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
        this.camPosition = this.camera.cam3D.position
        this.canToggleCamera = true;
        this.isThirdPerson = false;
        document.addEventListener('keydown',Player.onKeyDown);
        document.addEventListener('keyup', Player.onKeyUp);
    }
    private static onKeyDown(event:KeyboardEvent) {
        Player.keysPressed[event.code] = true;
    }
    private static onKeyUp(event:KeyboardEvent) {
        Player.keysPressed[event.code] = false
    }
    private mapKeysToPlayer() {
        if (Player.keysPressed['KeyP']) {
            console.log("Terminated logs");
            console.log = ()=>{};
        }
        if (Player.keysPressed['Space']) {
            this.moveCharacterUp(this.dynamicData.jumpVelocity)//the linvel made it sluggish so i had to increase the number
        }
        if (Player.keysPressed['KeyW']) {
            if (Player.keysPressed['ShiftLeft']) this.dynamicData.horizontalVelocity += 10;
            this.moveCharacterForward(this.dynamicData.horizontalVelocity)
        }
        if (Player.keysPressed['KeyS']) {
            this.moveCharacterBackward(this.dynamicData.horizontalVelocity);
        }
        if (Player.keysPressed['KeyA']) {
            this.moveCharacterLeft(this.dynamicData.horizontalVelocity);
        }
        if (Player.keysPressed['KeyD']) {
            this.moveCharacterRight(this.dynamicData.horizontalVelocity);
        }
        if (Player.keysPressed['ArrowLeft'])  {
            this.rotateCharacterX(-this.dynamicData.rotationDelta)
        };  
        if (Player.keysPressed['ArrowRight']) {
            this.rotateCharacterX(+this.dynamicData.rotationDelta)
        };
        if (Player.keysPressed['ArrowUp']) {
            this.camera.rotateCameraUp(this.isThirdPerson)
        };  
        if (Player.keysPressed['ArrowDown']) {
            this.camera.rotateCameraDown(this.isThirdPerson)
        };
        if (Player.keysPressed['KeyT']) {
            if (this.canToggleCamera) {
                this.isThirdPerson = !this.isThirdPerson;
                this.canToggleCamera = false;  // prevent further toggles until key released
            }
        } else {
          this.canToggleCamera = true;  // reset when key released
        }
    }
    private mapKeysToAnimations() {
        if (this.isAirBorne()) {
            this.stopWalkSound()
            this.playJumpAnimation()
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
    private updateCamPerspective() {
        const targetZ = this.isThirdPerson ? 6 : 0;
        const newCamPosition = new THREE.Vector3(this.camPosition.x,this.camPosition.y,targetZ)
        this.camera.translateCamera(newCamPosition,0.1)
    }
    protected defineBehaviour() {//this is where all character updates to this instance happens.
        this.camPosition = this.camera.cam3D.position
        this.camera.updateCamera();
        this.mapKeysToPlayer();
        this.mapKeysToAnimations();
        this.updateCamPerspective();
    }
}
const PlayerCamArgs:CameraData = {
    FOV:75,
    nearPoint:0.1,
    farPoint:1000,
    cameraRotationDelta:0.05,
    cameraRotationSpeed:0.5,
    offsetY:4
}
const playerFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
    spawnPoint: new RAPIER.Vector3(0,20,0),
    characterHeight:1,
    characterWidth:1,
    mass:40,
    groundDetectionDistance:1.5,
    stepCheckDistance:4.5,
}
const playerDynamicData:DynamicControllerData = {
    maxStepUpHeight:3,
    jumpVelocity:30,
    jumpResistance:15,
    horizontalVelocity:30,
    rotationDelta:0.04,
    rotationSpeed:0.4,
}
export const player = new Player(playerFixedData,playerDynamicData)