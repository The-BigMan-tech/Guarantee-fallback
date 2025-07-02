import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityMiscData, ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { Entity } from "./entity.three";
import { entities } from "./entities.three";

export const entityGroup:THREE.Group = new THREE.Group();

for (let i = 0;i <= 1;i++) {
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
        attackDamage:0
    }
    const managingStruct:ManagingStructure = {
        group:entityGroup,
        entities:entities
    }
    const entity = new Entity(entityFixedData,entityDynamicData,entityMiscData,managingStruct);
    entities.push(entity);
    entityGroup.add(entity.controller);
}
export function updateAllEntities() {
    entities.forEach(entity => entity.updateOnLoop());
}