import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import { player } from "../player/player.three";


class Entity extends Controller {
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
    }
    protected onLoop(): void {
        this.moveToTarget(player.position)
    }
}
//char height and width can break for arbritary values that havent been tested
const entityFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
    spawnPoint: new RAPIER.Vector3(0,20,-10),
    characterHeight:2,
    characterWidth:1,
    shape:'capsule',
    mass:40,
}
const entityDynamicData:DynamicControllerData = {
    horizontalVelocity:20,
    jumpVelocity:25,
    jumpResistance:6,
    rotationDelta:0.05,
    rotationSpeed:0.8,
    maxStepUpHeight:2,
    gravityScale:1
}
export const entity = new Entity(entityFixedData,entityDynamicData)