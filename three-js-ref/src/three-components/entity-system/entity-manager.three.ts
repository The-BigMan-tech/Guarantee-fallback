import * as THREE from "three";
import type {FixedControllerData,DynamicControllerData} from "../controller/controller.three";
import type { EntityContract, EntityCount, EntityMiscData, EntityWrapper, ManagingStructure } from "./entity.three";
import * as RAPIER from '@dimforge/rapier3d'
import { player } from "../player/player.three";
import { entities, entityIndexMap} from "./entity.three";
import PoissonDiskSampling from 'poisson-disk-sampling';
import { choices } from "./choices";
import { groupIDs } from "./relationships.three";
import { entityFactory } from "./factory.three";
import type { FullEntityData } from "./entity.three";
import type { EntityFactory } from "./factory.three";
import { terrainManager } from "../terrain-system/terrain-manager.three";
import Denque from "denque";

interface EntitySpawnData {
    groupID:Readonly<string>,
    spawnWeight:Readonly<number>
}
type Singleton<T> = T;

class EntityManager {
    private static manager: EntityManager;
    private factory:Singleton<EntityFactory> = entityFactory;

    private entityCounts:EntityCount = {
        totalCount:0,
        individualCounts: {
            Enemy:{currentCount:0,minCount:1},
            NPC:{currentCount:0,minCount:1},
        }
    }
    private entityWrappers:EntityWrapper[] = [];

    private entityMapping:Record<EntityWrapper,EntitySpawnData> = {
        Enemy:{
            groupID:groupIDs.enemy,//i called it groupID cuz its not per isntance but per entity type or kind
            spawnWeight:10//an important thing to note is that when the weight is 0 but at least one of the others is non-zero,then this entity will never have the chance to be pciked but if all the other entities are non-zero,its the same thing as all of them having 10 or 100 cuz the weights are equal.thats the thing about weighted random.is the probabliliy of picking one relative to the probability of others not absolute probability.so to totally remove entities,set entity cap to 0.
        },
        NPC: {
            groupID:groupIDs.npc,
            spawnWeight:10
        }
    }
    private groupIDList:string[] = [];
    private entitySpawnWeights:number[] = [];

    private multiChoicePercent = 50;
    private readonly originalChoicePercent:number = this.multiChoicePercent;
    private readonly maxChoicePercent:number = 100;

    private readonly maxEntityCap = 5;//the max number of entities in the world before it stops spawning

    private spawnTimer:number = 0;
    private readonly spawnCooldown:number = 3;

    private readonly spawnRadius = 50;//the radius from the player where spawning begins.the higher the spawn radius,the more the entities that will spawn at a given time and vice versa but it stops at the max entity cap or when all min thresholds are satisfied.i believe that increasing the radius is better because not only does it supply spacing but it also means that the manager will spawn entities lesser to reach the cap or satisfy the thresh such that all the entities that will ever be needed in the world are saved in one go preventing calls to spawn from happening again in the next frame.i believe that this preserves performance
    private readonly minSpawnDistance = 10; // adjust as needed
    private readonly despawnRadius: number = 1000;

    public entityGroup:THREE.Group = new THREE.Group();
    private raycaster = new THREE.Raycaster();
    private down = new THREE.Vector3(0, -1, 0);

    //the reason why im using a queue is for two reasons.one is to prevent confusion from the entities array that holds all the entities to be used to update and cleanup each indiviudual entity.another reason is also because i will only be using the refs in this array once which is upon saving an entity to the game not persistently.so i have to consume it as im iterating over it but if i went with the simple option of looping over an array and then deleting the element on iteration,it can lead to unexpected behaviour.i could have used a set but im sure that creating an iterable in every frame where i need to create an entity will lag perf.i can just use a while loop over an array while popping off the elements but i want to use a different type api to distinquish them and also,i get the perk of saving entities to the game in the order they were created at O(1) time unlike an array which can have its use cases if order is a priority and i can easily siwtch it to a pop with little code changes.
    private createdEntitiesBatch:Denque<EntityContract> = new Denque();

    private constructor() {};
    public static get instance(): EntityManager {
        if (!EntityManager.manager)  {
            EntityManager.manager = new EntityManager();
            EntityManager.manager.entityWrappers = Object.keys(EntityManager.manager.entityCounts.individualCounts) as EntityWrapper[]
            Object.values(EntityManager.manager.entityMapping).forEach(value=>{
                EntityManager.manager.groupIDList.push(value.groupID);
                EntityManager.manager.entitySpawnWeights.push(value.spawnWeight);
            })
        }
        return EntityManager.manager;
    }
    private getHeightAtPosition(x: number, z: number): number {
        //this eary return is temporrary till i fix the prob
        return 20  // Default ground height if no intersection
        const maxHeightAboveTerrain = 100;
        const origin = new THREE.Vector3(x, maxHeightAboveTerrain, z);
        this.raycaster.set(origin, this.down);
        const intersects = this.raycaster.intersectObjects(terrainManager.floorGroup.children, true);
        if (intersects.length > 0) return intersects[0].point.y;
        console.log("Used default height");
    }
    private createEntity(groupID:string,spawnPoint:THREE.Vector3Like):EntityContract {
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
            case (this.entityMapping['Enemy'].groupID): {
                const enemy = this.factory.createEnemy(entityData);
                enemy._entity.incEntityCount('Enemy');
                return enemy
            }
            case (this.entityMapping['NPC'].groupID): {
                const npc = this.factory.createNPC(entityData);
                npc._entity.incEntityCount('NPC');
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
                if (this.entityCounts.totalCount > this.maxEntityCap) {
                    console.log('count. reached cap limit');
                    return;
                }
                const finalEntity = this.createEntity(groupID,spawnPoint);
                this.createdEntitiesBatch.push(finalEntity);
            }
        }
    }



    private despawnFarEntities() {
        const playerPos = player.char.position;
        for (let i = entities.length - 1; i >= 0; i--) {
            const entityWrapper = entities[i];
            const entityPos = entityWrapper._entity.char.position; // Assuming THREE.Vector3
            const distance = playerPos.distanceTo(entityPos);
            if (distance > this.despawnRadius) {
                entityWrapper._entity.cleanUp()
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
                    this.multiChoicePercent = this.maxChoicePercent;
                    canSpawnEntities = true;
                    break;//to prevent unnecessary computation since it has already been decided that it can spawn
                }
            }
        }
        console.log('canSpawnEntities:', canSpawnEntities);
        if (canSpawnEntities) {
            this.spawnTimer += deltaTime;//incresing the timer only when there are no entities ensures that new entities are only spawned after all other entities are dead.
            if (this.spawnTimer > this.spawnCooldown) {
                this.spawnEntities();
                this.spawnTimer = 0;
                this.multiChoicePercent = this.originalChoicePercent
            }
        }else this.spawnTimer = 0; // Reset spawn timer if entities exist to prevent accumulation when entities still exist
    }

    private saveEntitiesToGame() {
        while (this.createdEntitiesBatch.length > 0) {
            const createdEntity = this.createdEntitiesBatch.shift()!;
            entities.push(createdEntity);
            entityIndexMap.set(createdEntity._entity,entities.length-1);
            this.entityGroup.add(createdEntity._entity.char);
            this.entityGroup.add(createdEntity._entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
        }
    }


    public updateAllEntities(deltaTime:number) {
        this.saveEntitiesToGame();//the reason why i moved the saving of entities to the game to the next frame is to reduce the amount of time when entities spawn visually and when they actually move cuz if not,the entities will be saved to the game,true, but they will appear frozen till the player and the terrain updates which can spoil experience.so what i now did was to batch them in the same frame but make them available in game in the same frame they will be updated and its better than prioritizing entity updates first
        entities.forEach(entityWrapper => entityWrapper._entity.updateController(deltaTime));
        this.despawnFarEntities();
        this.spawnNewEntitiesWithCooldown(deltaTime);
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
