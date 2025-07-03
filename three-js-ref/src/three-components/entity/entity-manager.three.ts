import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityMiscData, ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { Entity,entities} from "./entity.three";

type Singleton<T> = T;

class EntityManager {
    private static manager: EntityManager;
    public entityGroup:THREE.Group = new THREE.Group();

    private constructor() {};
    
    static get instance(): EntityManager {
        if (!EntityManager.manager) EntityManager.manager = new EntityManager();
        return EntityManager.manager;
    }

    private spawnEntities() {
        for (let i = 0;i < 1;i++) {
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
                knockback:150,
                attackDamage:0
            }
            const managingStruct:ManagingStructure = {
                group:this.entityGroup,
                entities:entities
            }
            const entity = new Entity(entityFixedData,entityDynamicData,entityMiscData,managingStruct);
            entities.push(entity);
            this.entityGroup.add(entity.controller);
            this.entityGroup.add(entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
        }
    }
    public updateAllEntities(deltaTime:number) {
        entities.forEach(entity => entity.updateController(deltaTime));
        if (entities.length == 0) {
            this.spawnEntities()
        }
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
