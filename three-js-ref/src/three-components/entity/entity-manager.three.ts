import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityMiscData, ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { Entity,entities} from "./entity.three";
import PoissonDiskSampling from 'poisson-disk-sampling';
import { cubesGroup } from "../tall-cubes.three";
import { Enemy } from "./enemy.three";


type Singleton<T> = T;
class EntityManager {
    private static manager: EntityManager;
    public entityGroup:THREE.Group = new THREE.Group();

    private spawnTimer:number = 0;
    private spawnCooldown:number = 3;
    private despawnRadius: number = 1000;

    private raycaster = new THREE.Raycaster();
    private down = new THREE.Vector3(0, -1, 0);


    private constructor() {};
    
    static get instance(): EntityManager {
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
    private spawnEntities() {
        const spawnRadius = 10; // or smaller if you want
        const minSpawnDistance = 5; // adjust as needed

        const pds = new PoissonDiskSampling({
            shape: [spawnRadius, spawnRadius],
            minDistance: minSpawnDistance,
            tries: 10
        });

        const spawnPoints = pds.fill();
        for (const [x, z] of spawnPoints) {
            const playerPos = player.position;
            const spawnX = playerPos.x + (x - (spawnRadius / 2));//offset from the player spawnpoint by adding the player cords to it
            const spawnZ = playerPos.z + (z - (spawnRadius / 2));//the reason why we are adding z-r/2 instead of z directly is so that its centered around that origin
            const spawnY = this.getHeightAtPosition(spawnX,spawnZ); // or sample terrain height at (spawnX, spawnZ)
            const spawnPoint = new RAPIER.Vector3(spawnX, spawnY, spawnZ);

            const entityFixedData:FixedControllerData = {
                modelPath:'./silvermoon.glb',
                spawnPoint:spawnPoint,
                characterHeight:2,
                characterWidth:1,
                shape:'capsule',
                mass:40,
            }
            const entityDynamicData:DynamicControllerData = {
                horizontalVelocity:this.randomIntBetween(10,30),
                jumpVelocity:this.randomIntBetween(27,35),
                jumpResistance:this.randomIntBetween(6,10),
                rotationDelta:0.05,
                rotationSpeed:0.2,
                maxStepUpHeight:2,
                gravityScale:1
            }
            const entityMiscData:EntityMiscData = {
                targetController:player,
                targetHealth:player.health,
                healthValue:this.randomIntBetween(4,10),
                knockback:this.randomIntBetween(150,180),
                attackDamage:this.randomFloatBetween(0.5,1)//variate this one
            }
            const managingStruct:ManagingStructure = {
                group:this.entityGroup,
                entities:entities
            }
            const entity = new Entity(entityFixedData,entityDynamicData,entityMiscData,managingStruct);
            const enemy = new Enemy(entity)
            entities.push(enemy);
            this.entityGroup.add(enemy._entity.controller);
            this.entityGroup.add(enemy._entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
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
        entities.forEach(entityWrapper => entityWrapper._entity.updateController(deltaTime));
        this.despawnFarEntities();
        this.spawnNewEntitiesWithCooldown(deltaTime)
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
