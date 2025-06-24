import { Camera, type CameraData } from "../camera/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"

// console.log = ()=>{};
interface PlayerCamData extends CameraData {
    offsetY:number | 'auto';
}
function keyToVector3(key: string): THREE.Vector3 {
    const [xStr, yStr, zStr] = key.split(':');
    return new THREE.Vector3(parseFloat(xStr), parseFloat(yStr), parseFloat(zStr));
}
class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private firstPersonClamp = 75;
    private thirdPersonClamp = 10;
    private cameraClampAngle:number =  this.firstPersonClamp;

    public camera:Camera;
    private canToggleCamera:boolean = true;//to debounce perspective toggling
    private isThirdPerson:boolean = false;

    private offsetY:number;
    private targetZ:number = 0;//the 0 is just for initialization sake so ts wont complain but it will be changed correctly during the render loop
    private targetY:number = 0;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,camArgs:PlayerCamData) {
        super(fixedData,dynamicData);
        this.offsetY = (camArgs.offsetY=='auto')?fixedData.characterHeight:camArgs.offsetY
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
    private mapKeysToPlayer() {
        if (Player.keysPressed['KeyP']) {
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
            if (!this.isThirdPerson) {
                this.targetY -= 0.2;
                this.targetZ = -0.3;
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
        if (this.isThirdPerson) {
            this.cameraClampAngle = this.thirdPersonClamp
            this.targetZ = 6
            this.targetY = this.offsetY
        }else {
            this.cameraClampAngle = this.firstPersonClamp
            this.targetZ = 0
            this.targetY = this.offsetY-1
        }
    }
    private updateCamPosition() {
        const camPosition = this.camera.cam3D.position;
        const newCamPosition = new THREE.Vector3(camPosition.x,this.targetY,this.targetZ)
        this.camera.translateCamera(newCamPosition,0.2);
    }
    private findPath() {
        this.detectObstaclesRadially();
        for (const [key, isFree] of this.collisionFreeMap.entries()) {
            const point = keyToVector3(key);
            console.log(`Radial Point ${point.toArray()} is ${isFree ? 'free' : 'blocked'}`);
        }
    }
    protected defineBehaviour() {//this is where all character updates to this instance happens.
        this.toggleThirdPerson();
        this.mapKeysToPlayer();
        this.mapKeysToAnimations();
        this.updateCamPosition();
        this.camera.updateCamera();
        this.findPath()
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
    characterHeight:4,
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
    maxStepUpHeight:3,
    gravityScale:1
}
export const player = new Player(playerFixedData,playerDynamicData,PlayerCamArgs)