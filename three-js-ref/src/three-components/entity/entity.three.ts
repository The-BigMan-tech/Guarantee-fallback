import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import { player } from "../player/player.three";


class Entity extends Controller {
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
    }
    protected onLoop(): void {
        this.wakeUpBody();
        this.moveToTarget(player.position)
    }
}
const entityFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
    spawnPoint: new RAPIER.Vector3(0,20,-10),
    characterHeight:4,
    characterWidth:1,
    shape:'capsule',
    mass:40,
}
const entityDynamicData:DynamicControllerData = {
    horizontalVelocity:10,
    jumpVelocity:20,
    jumpResistance:15,
    rotationDelta:0.05,
    rotationSpeed:0.4,
    maxStepUpHeight:3,
    gravityScale:1
}
export const entity = new Entity(entityFixedData,entityDynamicData)