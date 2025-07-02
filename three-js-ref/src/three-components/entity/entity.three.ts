import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { player } from "../player/player.three";
import { Health } from "../health/health";

interface EntityMiscData {
    healthValue:number,
    currentTarget:Controller | null
}
class Entity extends Controller {
    private health:Health;
    private currentTarget:Controller | null = null;
    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:EntityMiscData) {
        super(fixedData,dynamicData);
        this.health = new Health(miscData.healthValue);
        this.currentTarget = miscData.currentTarget
    }
    private attack() {
        
    }
    private displayHealth() {
        console.log("Health. Entity: ",this.health.value);
    }
    private act() {
        console.log("Agent has reached target");
        this.attack()
    }
    private updateNavPosition() {
        this.navPosition = this.currentTarget?.position || null
    }
    protected onLoop(): void {
        this.displayHealth();
        this.updateNavPosition()
        if (this.navPosition) {
            const atTarget = this.navToTarget(this.navPosition);
            if (atTarget) {
                this.act()
            }
        }
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
    jumpVelocity:27,
    jumpResistance:6,
    rotationDelta:0.05,
    rotationSpeed:0.2,
    maxStepUpHeight:2,
    gravityScale:1
}
const entityMiscData:EntityMiscData = {
    healthValue:10,
    currentTarget:player
}
export const entity = new Entity(entityFixedData,entityDynamicData,entityMiscData)