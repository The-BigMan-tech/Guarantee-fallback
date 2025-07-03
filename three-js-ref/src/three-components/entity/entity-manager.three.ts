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

    private spawnTimer:number = 0;
    private spawnCooldown:number = 3;
    private spawnCount:number = 1;

    private constructor() {};
    
    static get instance(): EntityManager {
        if (!EntityManager.manager) EntityManager.manager = new EntityManager();
        return EntityManager.manager;
    }

    private spawnEntities() {
        for (let i = 0;i < this.spawnCount;i++) {
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
    public spawnNewEntitiesWithCooldown(deltaTime:number) {
        if (entities.length === 0) {
            this.spawnTimer += deltaTime;//incresing the timer only when there are no entities ensures that new entities are only spawned after all other entities are dead.
            if (this.spawnTimer > this.spawnCooldown) {
                this.spawnEntities()
                this.spawnTimer = 0;
            }
        }else {
            this.spawnTimer = 0; // Reset spawn timer if entities exist to prevent accumulation when entities still exist
        }
    }
    public updateAllEntities(deltaTime:number) {
        entities.forEach(entity => entity.updateController(deltaTime));
        this.spawnNewEntitiesWithCooldown(deltaTime)
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
