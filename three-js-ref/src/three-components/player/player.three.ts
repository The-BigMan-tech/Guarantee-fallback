import { Camera } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"


class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    public camera:Camera;
    private canToggleCamera:boolean;//to debounce perspective toggling
    private isThirdPerson:boolean;
    private cameraClampAngle:number;
    private static firstPersonClamp = 90
    private static thirdPersonClamp = 10;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,camArgs:PlayerCamData) {
        super(fixedData,dynamicData);
        this.canToggleCamera = true;
        this.isThirdPerson = false;
        this.cameraClampAngle = Player.firstPersonClamp;

        const offsetY = (camArgs.offsetY=='auto')?fixedData.characterHeight:camArgs.offsetY
        this.camera = new Camera({...camArgs,offsetY})
        this.addObject(this.camera.cam3D);//any object thats added to the controller must provide their functionality as the controller doesn provide any logic for these objects except adding them to the chaacter object
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
            this.camera.rotateCameraUp(this.cameraClampAngle)
        };  
        if (Player.keysPressed['ArrowDown']) {
            this.camera.rotateCameraDown(this.cameraClampAngle)
        };
        if (Player.keysPressed['KeyT']) {
            if (this.canToggleCamera) {
                this.isThirdPerson = !this.isThirdPerson;
                this.canToggleCamera = false;  // prevent further toggles until key released
            }
        }else this.canToggleCamera = true;  // reset when key released
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
    private toggleThirdPerson() {//this is where the camera is updated and optionally adding other behaviour to the camera before that update
        const camPosition = this.camera.cam3D.position
        let targetZ;
        if (this.isThirdPerson) {
            this.cameraClampAngle = Player.thirdPersonClamp
            targetZ = 6
        }else {
            this.cameraClampAngle = Player.firstPersonClamp
            targetZ = 0
        }
        const newCamPosition = new THREE.Vector3(camPosition.x,camPosition.y,targetZ)
        this.camera.translateCamera(newCamPosition,0.1);
    }
    protected defineBehaviour() {//this is where all character updates to this instance happens.
        this.toggleThirdPerson();
        this.camera.updateCamera()
        this.mapKeysToPlayer();
        this.mapKeysToAnimations();
    }
}
interface PlayerCamData {
    FOV: number;
    nearPoint: number;
    farPoint: number;
    cameraRotationDelta: number;
    cameraRotationSpeed: number;
    offsetY:number | 'auto';
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
    characterHeight:4,
    characterWidth:1,
    mass:40,
}
const playerDynamicData:DynamicControllerData = {
    horizontalVelocity:30,
    jumpVelocity:30,
    jumpResistance:15,
    rotationDelta:0.04,
    rotationSpeed:0.4,
    maxStepUpHeight:3,
    gravityScale:1
}
export const player = new Player(playerFixedData,playerDynamicData,PlayerCamArgs)