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
import { randInt,randFloat} from "three/src/math/MathUtils.js";
import { choices } from "./choices";
import { groupIDs } from "./relationships.three";


interface EntityMetadata {
    groupID:string,
    spawnWeight:number
}
interface FullEntityData {
    fixedData:FixedControllerData,
    dynamicData:DynamicControllerData,
    miscData:EntityMiscData
    managingStruct:ManagingStructure
}


type Singleton<T> = T;
class EntityManager {
    private static entityMapping:Record<string,EntityMetadata> = {
        Enemy:{
            groupID:groupIDs.enemy,//i called it groupID cuz its not per isntance but per entity type or kind
            spawnWeight:6
        },
        NPC: {
            groupID:groupIDs.npc,
            spawnWeight:10
        }
    }
    private groupIDList:string[] = [];
    private entitySpawnWeights:number[] = [];
    private multiChoicePercent = 50;

    
    private static manager: EntityManager;
    public entityGroup:THREE.Group = new THREE.Group();

    private spawnTimer:number = 0;
    private spawnCooldown:number = 3;

    private spawnRadius = 25;
    private minSpawnDistance = 10; // adjust as needed
    private despawnRadius: number = 1000;

    private raycaster = new THREE.Raycaster();
    private down = new THREE.Vector3(0, -1, 0);


    private constructor() {};
    public static get instance(): EntityManager {
        if (!EntityManager.manager)  {
            EntityManager.manager = new EntityManager();
            Object.values(EntityManager.entityMapping).forEach(value=>{
                EntityManager.manager.groupIDList.push(value.groupID);
                EntityManager.manager.entitySpawnWeights.push(value.spawnWeight);
            })
        }
        return EntityManager.manager;
    }


    private getHeightAtPosition(x: number, z: number): number {
        const maxHeightAboveTerrain = 100;
        const origin = new THREE.Vector3(x, maxHeightAboveTerrain, z);
        this.raycaster.set(origin, this.down);
        const intersects = this.raycaster.intersectObjects(cubesGroup.children, true);
        if (intersects.length > 0) return intersects[0].point.y;
        console.log("Used default height");
        return 20  // Default ground height if no intersection
    }

    private createEnemy(entityData:FullEntityData):EntityContract {
        const fixedData = entityData.fixedData;
        const dynamicData = entityData.dynamicData;
        const miscData = entityData.miscData;//i did this to make the code neater and it will work since it references the same object
        fixedData.modelPath = Enemy.modelPath;
        miscData.targetEntity = player;
        dynamicData.horizontalVelocity = randInt(10,20);
        dynamicData.jumpVelocity = randInt(10,25);
        dynamicData.jumpResistance = randInt(6,10);
        miscData.healthValue = randInt(20,25);
        miscData.knockback = randInt(100,150);
        miscData.attackDamage = randFloat(0.5,1);
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        const enemy = new Enemy(entity);
        return enemy
    }
    private createNPC(entityData:FullEntityData):EntityContract {
        const fixedData = entityData.fixedData;
        const dynamicData = entityData.dynamicData;
        const miscData = entityData.miscData
        fixedData.modelPath = NPC.modelPath;
        dynamicData.horizontalVelocity = randInt(15,30);
        dynamicData.jumpVelocity = randInt(25,32);
        dynamicData.jumpResistance = randInt(6,10);
        miscData.healthValue = randInt(10,15);
        miscData.knockback = randInt(100,150);
        miscData.attackDamage = randFloat(1,3);
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        const npc = new NPC(entity);
        return npc
    }
    private createDefault(entityData:FullEntityData):EntityContract {
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return {_entity:entity}
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
        }
        const entityData:FullEntityData = {//this is the full structure composed of the other data above
            fixedData:entityFixedData,
            dynamicData:entityDynamicData,
            miscData:entityMiscData,
            managingStruct:entityManagingStruct
        };
        switch (groupID) {
            case (EntityManager.entityMapping['Enemy'].groupID): {
                return this.createEnemy(entityData);
            }
            case (EntityManager.entityMapping['NPC'].groupID): {
                return this.createNPC(entityData);
            }
            default: {
                return this.createDefault(entityData)
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
                const finalEntity = this.createEntity(groupID,spawnPoint)
                this.saveEntityToGame(finalEntity)
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
        this.entityGroup.add(entityKind._entity.char);
        this.entityGroup.add(entityKind._entity.points);//add the points to the scene when the controller is added to the scene which ensures that this is called after the scene has been created)
    }


    public updateAllEntities(deltaTime:number) {
        entities.forEach(entityWrapper => entityWrapper._entity.updateController(deltaTime));
        this.despawnFarEntities();
        this.spawnNewEntitiesWithCooldown(deltaTime);
    }
}
export const entityManager:Singleton<EntityManager> = EntityManager.instance;
