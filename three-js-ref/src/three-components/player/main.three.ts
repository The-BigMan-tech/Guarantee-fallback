import { pitchObject,rotateCameraDown,rotateCameraUp,updateCameraRotation} from "../player/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"

class Player extends Controller {
    private static keysPressed:Record<string,boolean> = {};//i made it static not per instance so that the event listeners can access them
    private canToggleCamera:boolean;
    private isThirdPerson:boolean;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
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
            rotateCameraUp(this.isThirdPerson)
        };  
        if (Player.keysPressed['ArrowDown']) {
            rotateCameraDown(this.isThirdPerson)
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
            this.walkSound.stop()
            this.playJumpAnimation()
        }else if (Player.keysPressed['KeyW']) {//each key will have its own animation
            if (!this.walkSound.isPlaying) this.walkSound.play();
            this.playWalkAnimation()
        }else if (Player.keysPressed['KeyA']) {
            if (!this.walkSound.isPlaying) this.walkSound.play();
        }else if (Player.keysPressed['KeyS']) {
            if (!this.walkSound.isPlaying) this.walkSound.play();
        }else if (Player.keysPressed['KeyD']) {
            if (!this.walkSound.isPlaying) this.walkSound.play();
        }else {
            this.walkSound.stop();
            this.playIdleAnimation()
        }
    }
    private updateCamPerspective() {
        if (!this.dynamicData.camera) return;
        const targetZ = this.isThirdPerson ? 6 : 0;
        this.dynamicData.camera.position.z += (targetZ - this.dynamicData.camera.position.z) * 0.1; // 0.1 
    }
    public updatePlayer() {
        updateCameraRotation();
        this.mapKeysToPlayer();
        this.mapKeysToAnimations();
        this.updateCamPerspective();
        this.updateCharacter()
    }
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
    camera:pitchObject
}
export const player = new Player(playerFixedData,playerDynamicData)