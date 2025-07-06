import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityContract, EntityMiscData, ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { Entity,entities} from "./entity.three";
import PoissonDiskSampling from 'poisson-disk-sampling';
import { cubesGroup } from "../tall-cubes.three";
import { Enemy } from "./enemy.three";
import { NPC } from "./npc.three";

enum EntityMapping {
    Enemy = 1,
    NPC = 2,
}
interface FullEntityData {
    fixedData:FixedControllerData,
    dynamicData:DynamicControllerData,
    miscData:EntityMiscData
    managingStruct:ManagingStructure
}
type Singleton<T> = T;
class EntityManager {
    private static manager: EntityManager;
    public entityGroup:THREE.Group = new THREE.Group();

    private spawnTimer:number = 0;
    private spawnCooldown:number = 3;

    private spawnRadius = 5; // or smaller if you want
    private despawnRadius: number = 1000;

    private raycaster = new THREE.Raycaster();
    private down = new THREE.Vector3(0, -1, 0);


    private constructor() {};
    
    public static get instance(): EntityManager {
        if (!EntityManager.manager) EntityManager.manager = new EntityManager();
        return EntityManager.manager;
    }

    private randomIntBetween(min: number, max: number): number {
        return Math.floor((Math.random() * (max - min + 1)) + min);
    }
    private randomFloatBetween(min: number, max: number): number {
        return ((Math.random() * (max - min)) + min);
    }

    private getHeightAtPosition(x: number, z: number): number {
        const maxHeightAboveTerrain = 100;
        const origin = new THREE.Vector3(x, maxHeightAboveTerrain, z);
        this.raycaster.set(origin, this.down);
        const intersects = this.raycaster.intersectObjects(cubesGroup.children, true);
        if (intersects.length > 0) return intersects[0].point.y;
        return 20  // Default ground height if no intersection
    }

    private spawnEnemy(entityData:FullEntityData) {
        entityData.fixedData.modelPath = "./silvermoon.glb"
        entityData.dynamicData.horizontalVelocity = this.randomIntBetween(10,30);
        entityData.dynamicData.jumpVelocity = this.randomIntBetween(10,25);
        entityData.dynamicData.jumpResistance = this.randomIntBetween(6,10);
        entityData.miscData.targetController = player;
        entityData.miscData.targetHealth = player.health;
        entityData.miscData.healthValue = this.randomIntBetween(4,25);
        entityData.miscData.knockback = this.randomIntBetween(100,150);
        entityData.miscData.attackDamage = this.randomFloatBetween(0.5,1);
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        const enemy = new Enemy(entity);
        this.saveEntityToGame(enemy);
    }
    private spawnNPC(entityData:FullEntityData) {
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        const npc = new NPC(entity);
        this.saveEntityToGame(npc);
    }


    private spawnEntities() {
        const minSpawnDistance = 5; // adjust as needed
        const pds = new PoissonDiskSampling({
            shape: [this.spawnRadius, this.spawnRadius],
            minDistance: minSpawnDistance,
            tries: 10
        });
        const spawnPoints = pds.fill();

        for (const [x, z] of spawnPoints) {
            const playerPos = player.position;
            const spawnX = playerPos.x + (x - (this.spawnRadius / 2));//offset from the player spawnpoint by adding the player cords to it
            const spawnZ = playerPos.z + (z - (this.spawnRadius / 2));//the reason why we are adding z-r/2 instead of z directly is so that its centered around that origin
            const spawnY = this.getHeightAtPosition(spawnX,spawnZ); // or sample terrain height at (spawnX, spawnZ)
            const spawnPoint = new RAPIER.Vector3(spawnX, spawnY, spawnZ);

            //these are just basic props for any entity type.it can be passed to methods that spawn specific entity types to configure any of these parameters before creating an entity of their preferred type
            const entityFixedData:FixedControllerData = {//this is for controller data thats not supposed to be changed after creation
                modelPath:'',
                spawnPoint:spawnPoint,
                characterHeight:2,
                characterWidth:1,
                shape:'capsule',
                mass:40,
            }
            const entityDynamicData:DynamicControllerData = {//this is for controller data that can be changed after creation
                horizontalVelocity:0,
                jumpVelocity:0,
                jumpResistance:0,
                rotationDelta:0.05,
                rotationSpeed:0.2,
                maxStepUpHeight:2,
                gravityScale:1
            }
            const entityMiscData:EntityMiscData = {//this is for entity specific data decoupled from their controller
                targetController:null,
                targetHealth:null,
                healthValue:0,
                knockback:0,
                attackDamage:0
            }
            const entityManagingStruct:ManagingStructure = {//these are data structures passed to the individual entities so that they can use it for clean up
                group:this.entityGroup,
                entities:entities
            }
            const entityData:FullEntityData = {//this is the full structure composed of the other data above
                fixedData:entityFixedData,
                dynamicData:entityDynamicData,
                miscData:entityMiscData,
                managingStruct:entityManagingStruct
            };

            const entityKind:number = this.randomIntBetween(1,1);
            switch (entityKind) {
                case (EntityMapping.Enemy): {
                    this.spawnEnemy(entityData);
                    break;
                }
                case (EntityMapping.NPC): {
                    this.spawnNPC(entityData);
                    break;
                }
            }
        }
    }



    private despawnFarEntities() {
        const playerPos = player.controller.position;
        for (let i = entities.length - 1; i >= 0; i--) {
            const entityWrapper = entities[i];
            const entityPos = entityWrapper._entity.controller.position; // Assuming THREE.Vector3
            const distance = playerPos.distanceTo(entityPos);
            if (distance > this.despawnRadius) {
                entityWrapper._entity.cleanUp()
            }
        }
    }
    private spawnNewEntitiesWithCooldown(deltaTime:number) {
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
    private saveEntityToGame(entityKind:EntityContract) {
        entities.push(entityKind);
        this.entityGroup.add(entityKind._entity.controller);
        this.entityGroup.add(entityKind._entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
    }



    public updateAllEntities(deltaTime:number) {
        entities.forEach(entityWrapper => entityWrapper._entity.updateController(deltaTime));
        this.despawnFarEntities();
        this.spawnNewEntitiesWithCooldown(deltaTime);
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
