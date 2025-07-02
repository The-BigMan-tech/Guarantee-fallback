import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three"
import { player } from "../player/player.three";
import { Health } from "../health/health";

interface EntityMiscData {
    healthValue:number,
    targetController:Controller | null,
    targetHealth:Health | null,
    attackDamage:number
}
class Entity extends Controller {
    private targetController:Controller | null = null;
    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    public health:Health;
    private targetHealth:Health | null = null;

    private attackDamage:number;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:EntityMiscData) {
        super(fixedData,dynamicData);
        this.health = new Health(miscData.healthValue);
        this.targetController = miscData.targetController
        this.targetHealth = miscData.targetHealth;
        this.attackDamage = miscData.attackDamage
    }
    private attack() {
        if (!this.targetHealth) return;
        this.targetHealth.takeDamage(this.attackDamage)
    }
    private displayHealth() {
        console.log("Health. Entity: ",this.health.value);
    }
    private act() {//the behaviour when it reaches the target will be later tied to a state machine
        console.log("Agent has reached target");
        this.attack()
    }
    private updateNavPosition() {//the navPosition is updated internally by the entity.ill later tie it to a behaviour state machine
        this.navPosition = this.targetController?.position || null
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
    targetController:player,
    targetHealth:player.health,
    healthValue:10,
    attackDamage:1
}
export const entity = new Entity(entityFixedData,entityDynamicData,entityMiscData)