import { keysPressed,toggleThirdPerson,cameraMode} from "../player/globals.three";
import { pitchObject,updateCamera} from "../player/camera.three";
import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"

class Player extends Controller {
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
        document.addEventListener('keydown',Player.onKeyDown);
        document.addEventListener('keyup', Player.onKeyUp);
    }
    private static onKeyDown(event:KeyboardEvent) {
        keysPressed[event.code] = true;
        console.log("KEY BIND: ",event.code)
        if (event.code == 'KeyP') {
            console.log("Terminated logs");
            console.log = ()=>{};
        }
    }
    private static onKeyUp(event:KeyboardEvent) {
        keysPressed[event.code] = false
    }
    private mapKeysToPlayer() {
        if (keysPressed['Space']) {
            this.moveCharacterUp(this.dynamicData.jumpVelocity)//the linvel made it sluggish so i had to increase the number
        }
        if (keysPressed['KeyW']) {
            if (keysPressed['ShiftLeft']) this.dynamicData.horizontalVelocity += 10;
            this.moveCharacterForward(this.dynamicData.horizontalVelocity)
        }
        if (keysPressed['KeyS']) {
            this.moveCharacterBackward(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['KeyA']) {
            this.moveCharacterLeft(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['KeyD']) {
            this.moveCharacterRight(this.dynamicData.horizontalVelocity);
        }
        if (keysPressed['ArrowLeft'])  {
            this.rotateCharacterX(-this.dynamicData.rotationDelta)
        };  
        if (keysPressed['ArrowRight']) {
            this.rotateCharacterX(+this.dynamicData.rotationDelta)
        };
        toggleThirdPerson();
    }
    private mapKeysToAnimations() {
        if (this.isAirBorne()) {
            this.walkSound.stop()
            this.playJumpAnimation()
        }else if (keysPressed['KeyW']) {//each key will have its own animation
            this.walkSound.play()
            this.playWalkAnimation()
        }else if (keysPressed['KeyA']) {
            this.walkSound.play();
        }else if (keysPressed['KeyS']) {
            this.walkSound.play();
        }else if (keysPressed['KeyD']) {
            this.walkSound.play();
        }else {
            this.walkSound.stop();
            this.playIdleAnimation()
        }
    }
    private updateCamPerspective() {
        if (!this.dynamicData.camera) return;
        const targetZ = cameraMode.isThirdPerson ? 6 : 0;
        this.dynamicData.camera.position.z += (targetZ - this.dynamicData.camera.position.z) * 0.1; // 0.1 
    }
    public updatePlayer() {
        updateCamera()
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