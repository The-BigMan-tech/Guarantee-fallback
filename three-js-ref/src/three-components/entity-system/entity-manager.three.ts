import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityContract,EntityMiscData,ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { entities, entityIndexMap} from "./entity.three";
import PoissonDiskSampling from 'poisson-disk-sampling';
import { choices } from "./choices";
import { entityCounts, entityMapping } from "./entity-registry";
import { entityFactory } from "./factory.three";
import type { FullEntityData } from "./entity.three";
import type { EntityFactory } from "./factory.three";
import { terrainManager } from "../terrain-system/terrain-manager.three";
import Denque from "denque";
import type { EntitySpawnData,EntityWrapper,EntityCount} from "./global-types";

type Singleton<T> = T;

class EntityManager {
    private static manager: EntityManager;
    private factory:Singleton<EntityFactory> = entityFactory;

    private entityCounts:EntityCount = entityCounts;
    private entityMapping:Record<EntityWrapper,EntitySpawnData> = entityMapping;

    private readonly multiChoicePercent = 50;//it controls the percentage of entity types from the provided entity mapping struct that will be chosen at a time for every spawn point thats generated.Increasing this number will increase the probability of an entity of a given kind to spawn because the manager doesnt just choose one entity per point but rather,it can make two choices or three at a time with the choices influenced by the weight.Even at a low value,theres still a chance for an entity of a given kind to spawn as long as the weiht is considerable enough but this will increase that prob and a higher number will also slightly improve perf because it will spawn more at a time which reduces the time to reach the entity cap and number of times it has to run the weighted choice function.Tune as needed
    private readonly maxEntityCap = 10;//the max number of entities in the world before it stops spawning
    private readonly maxSpawnedEntitiesPerFrame = 3;//controls how many entities from the entity batch are spawned under one frame.reducing this value spreads the workload over many frames reducing initial lag spikes.if its too long,it will prolong spawning unecessarily causing it to linger in many frames which can cause some overhead on subsequent frames but if i make it too large,they might pop in too fast causing an initial spike.so 2-5 is a good value
    private readonly spawnCooldown:number = 7;//after deciding to spawn entities,this controls the time in seconds it waits before it actually spawns them.this is to improve exp as it gives the player some space before entities are spawned and it also improves perf on startup by only spawning entities afterw when the player has been spawned first not simultaneously
    private readonly spawnRadius = 50;//the radius from the player where spawning begins.the higher the spawn radius,the more the entities that will spawn at a given time and vice versa but it stops at the max entity cap or when all min thresholds are satisfied.i believe that increasing the radius is better because not only does it supply spacing but it also means that the manager will spawn entities lesser to reach the cap or satisfy the thresh such that all the entities that will ever be needed in the world are saved in one go preventing calls to spawn from happening again in the next frame.i believe that this preserves performance
    private readonly minSpawnDistance = 15; //the minimum distance between each entity that gets spawned within the spawn radius
    private readonly despawnRadius: number = 500;//its the opposite of spawn radius.it states the distance from the player proximity that entities will be despawned.it improves perf by only rendering entities that are actually meaningful to the gameplay
    
    private entityWrappers:EntityWrapper[] = [];
    private groupIDList:string[] = [];
    private entitySpawnWeights:number[] = [];

    public entityGroup:THREE.Group = new THREE.Group();//this is the group that contains all the entity meshes to be added to the scene
    private raycaster = new THREE.Raycaster();
    private down = new THREE.Vector3(0, -1, 0);

    //the reason why im using a queue is for two reasons.one is to prevent confusion from the entities array that holds all the entities to be used to update and cleanup each indiviudual entity.another reason is also because i will only be using the refs in this array once which is upon saving an entity to the game not persistently.so i have to consume it as im iterating over it but if i went with the simple option of looping over an array and then deleting the element on iteration,it can lead to unexpected behaviour.i could have used a set but im sure that creating an iterable in every frame where i need to create an entity will lag perf.i can just use a while loop over an array while popping off the elements but i want to use a different type api to distinquish them and also,i get the perk of saving entities to the game in the order they were created at O(1) time unlike an array which can have its use cases if order is a priority and i can easily siwtch it to a pop with little code changes.
    private createdEntitiesBatch:Denque<EntityContract> = new Denque();
    private spawnTimer:number = 0;


    private constructor() {};
    public static get instance(): EntityManager {
        if (!EntityManager.manager)  {
            EntityManager.manager = new EntityManager();
            EntityManager.manager.entityWrappers = Object.keys(EntityManager.manager.entityCounts.individualCounts) as EntityWrapper[]
            Object.values(EntityManager.manager.entityMapping).forEach(mapping=>{
                EntityManager.manager.groupIDList.push(mapping.groupID);
                EntityManager.manager.entitySpawnWeights.push(mapping.spawnWeight);
            })
        }
        return EntityManager.manager;
    }
    private getHeightAtPosition(x: number, z: number): number {
        const maxHeightAboveTerrain = 100;
        const origin = new THREE.Vector3(x, maxHeightAboveTerrain, z);
        this.raycaster.set(origin, this.down);
        const intersects = this.raycaster.intersectObjects(terrainManager.chunkParent.children, true);
        const heightBoost = 5;//to prevent situations where they will be spawned in between the ground
        if (intersects.length > 0) {
            console.log("Used height calc");
            return intersects[0].point.y + heightBoost;
        }else {
            console.log("Used height default");
            return 20;
        }
    }
    private createEntity(groupID:string,spawnPoint:THREE.Vector3Like):EntityContract {
         //these are just basic props for any entity type.it can be passed to methods that spawn specific entity types to configure any of these parameters before creating an entity of their preferred type
        const entityFixedData:FixedControllerData = {//this is for controller data thats not supposed to be changed after creation
            gltfModel:null,
            spawnPoint:spawnPoint,
            characterHeight:2,
            characterWidth:1,
            shape:'capsule',
            density:1,
        }
        const entityDynamicData:DynamicControllerData = {//this is for controller data that can be changed after creation
            horizontalVelocity:0,
            jumpVelocity:0,
            jumpResistance:0,
            rotationDelta:0.05,
            rotationSpeed:0.2,
            maxStepUpHeight:2.5,
            gravityScale:1
        }
        const entityMiscData:EntityMiscData = {//this is for entity specific data decoupled from their controller
            targetEntity:null,
            healthValue:0,
            knockback:0,
            attackDamage:0
        }
        const entityManagingStruct:ManagingStructure = {//these are data structures passed to the individual entities so that they can use it for clean up
            group:this.entityGroup,
            entities:entities,
            entityCounts:this.entityCounts,
            entityIndexMap:entityIndexMap
        }
        const entityData:FullEntityData = {//this is the full structure composed of the other data above
            fixedData:entityFixedData,
            dynamicData:entityDynamicData,
            miscData:entityMiscData,
            managingStruct:entityManagingStruct
        };
        switch (groupID) {
            case (this.entityMapping['HostileEntity'].groupID): {
                const hostileEntity = this.factory.createHostileEntity(entityData);
                return hostileEntity
            }
            case (this.entityMapping['NPC'].groupID): {
                const npc = this.factory.createNPC(entityData);
                return npc;
            }
            default: {
                return this.factory.createDefault(entityData)
            }
        }
    }

    private spawnEntities() {
        const pds = new PoissonDiskSampling({
            shape: [this.spawnRadius, this.spawnRadius],
            minDistance:this.minSpawnDistance,
            tries:10
        });
        const spawnPoints = pds.fill();
        for (const [x, z] of spawnPoints) {
            const playerPos = player.position;
            const spawnX = playerPos.x + (x - (this.spawnRadius / 2));//offset from the player spawnpoint by adding the player cords to it
            const spawnZ = playerPos.z + (z - (this.spawnRadius / 2));//the reason why we are adding z-r/2 instead of z directly is so that its centered around that origin
            const spawnY = this.getHeightAtPosition(spawnX,spawnZ); // or sample terrain height at (spawnX, spawnZ)
            const spawnPoint = new RAPIER.Vector3(spawnX, spawnY, spawnZ);
            
            //used ceiling to prevent fractional selection which isnt possible and it often produces the expected number of choices than rounding or flooring
            const multiChoiceCount = Math.ceil((this.multiChoicePercent / 100) * this.groupIDList.length);
            const chosenGroupIDs:string[] = choices<string>(this.groupIDList,this.entitySpawnWeights,multiChoiceCount)//get the first element
            
            for (const groupID of chosenGroupIDs) {
                console.log('count. totalCount:', this.entityCounts.totalCount);
                if (this.entityCounts.totalCount >= this.maxEntityCap) {
                    console.log('count. reached cap limit');
                    return;
                }
                const createdEntity = this.createEntity(groupID,spawnPoint);
                this.createdEntitiesBatch.push(createdEntity);
            }
        }
    }


    private spawnNewEntitiesWithCooldown(deltaTime:number) {
        console.log("Entity count: ",this.entityCounts);
        let canSpawnEntities:boolean = false;
        if (this.entityCounts.totalCount < this.maxEntityCap) {
            for (const wrapper of this.entityWrappers) {
                console.log('wrapper:', wrapper);
                const countData = this.entityCounts.individualCounts[wrapper];
                if (countData.currentCount < countData.minCount) {
                    canSpawnEntities = true;
                    break;//to prevent unnecessary computation since it has already been decided that it can spawn
                }
            }
        }
        console.log('canSpawnEntities:', canSpawnEntities);
        if (canSpawnEntities) {
            this.spawnTimer += deltaTime;//incresing the timer only when there are no entities ensures that new entities are only spawned when needed not every frame
            if (this.spawnTimer > this.spawnCooldown) {
                this.spawnEntities();
                this.spawnTimer = 0;
            }
        }else this.spawnTimer = 0; // Reset spawn timer if entities exist to prevent accumulation when entities still exist
    }

    private saveCreatedEntities() {
        let addedCount = 0;
        while ((this.createdEntitiesBatch.length > 0) && (addedCount < this.maxSpawnedEntitiesPerFrame)) {
            const createdEntity = this.createdEntitiesBatch.shift()!;
            entities.push(createdEntity);
            entityIndexMap.set(createdEntity._entity,entities.length-1);
            this.entityGroup.add(createdEntity._entity.char);
            this.entityGroup.add(createdEntity._entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
            addedCount++;
        }
    }
    private despawnIfFar(createdEntity:EntityContract) {
        const entityPos = createdEntity._entity.position;
        const distance = player.position.distanceTo(entityPos);
        if (distance > this.despawnRadius) {
            createdEntity._entity.cleanUp()
        }
    }
    public updateAllEntities(deltaTime:number) {
        this.saveCreatedEntities();//the reason why i moved the saving of entities to the game to the next frame is to reduce the amount of time when entities spawn visually and when they actually move cuz if not,the entities will be saved to the game,true, but they will appear frozen till the player and the terrain updates which can spoil experience.so what i now did was to batch them in the same frame but make them available in game in the same frame they will be updated and its better than prioritizing entity updates first
        for (const createdEntity of entities) {
            console.log('updating entities');
            createdEntity._entity.updateController(deltaTime);
            this.despawnIfFar(createdEntity);
        }
        this.spawnNewEntitiesWithCooldown(deltaTime);
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
