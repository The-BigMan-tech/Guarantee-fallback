import { HostileEntity } from "./hostile-entity.three";
import { NPC } from "./npc.three";
import { randInt,randFloat} from "three/src/math/MathUtils.js";
import { Entity } from "./entity.three";
import type { EntityContract } from "./entity.three";
import type { FullEntityData } from "./entity.three";
import { groupIDs } from "./entity-registry";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gltfLoader } from "../gltf-loader.three";

type Singleton<T> = T;
export class EntityFactory {
    private static factory:EntityFactory;

    private hostileEntityGLTF:GLTF | null = null;
    private npcGLTF:GLTF | null = null;


    private constructor() {
        gltfLoader.load(HostileEntity.modelPath,gltf=>{this.hostileEntityGLTF = gltf});
        gltfLoader.load(NPC.modelPath,gltf=>{this.npcGLTF = gltf});
    };

    public static get instance():EntityFactory {
        if (!EntityFactory.factory)  {
            EntityFactory.factory = new EntityFactory();
        }
        return EntityFactory.factory;
    }


    public createHostileEntity(entityData:FullEntityData):EntityContract {
        const fixedData = entityData.fixedData;
        const dynamicData = entityData.dynamicData;
        const miscData = entityData.miscData;//i did this to make the code neater and it will work since it references the same object
        fixedData.gltfModel = this.hostileEntityGLTF;
        dynamicData.horizontalVelocity = randInt(15,20);
        dynamicData.jumpVelocity = randInt(40,40);
        dynamicData.jumpResistance = Math.min(randInt(6,10),dynamicData.horizontalVelocity-5);//i capped it to be smaller than horizontal velocity cuz if not and it happens to be bigger than the horizontal vel,the entity wont be able to jump because its jump resistance is equal or bigger
        miscData.healthValue = randInt(25,30);
        miscData.knockback = randInt(100,120);
        miscData.attackDamage = randFloat(0.5,1);
        miscData.strength = randInt(100,100);
        const entity = new Entity(fixedData,dynamicData,miscData,entityData.managingStruct);
        const hostileEntity = new HostileEntity(entity);
        hostileEntity._entity._groupID = groupIDs.hostileEntity;//this is important to distinguish entities in a relationship.for example,not all attackers of the player are from a particular class
        hostileEntity._entity.incEntityCount('HostileEntity');
        return hostileEntity;
    }
    public createNPC(entityData:FullEntityData):EntityContract {
        const fixedData = entityData.fixedData;
        const dynamicData = entityData.dynamicData;
        const miscData = entityData.miscData
        fixedData.gltfModel = this.npcGLTF;
        dynamicData.horizontalVelocity = randInt(15,30);
        dynamicData.jumpVelocity = randInt(25,32);
        dynamicData.jumpResistance = Math.min(randInt(6,10),dynamicData.horizontalVelocity-5);
        miscData.healthValue = randInt(10,11);
        miscData.knockback = randInt(100,120);
        miscData.attackDamage = randFloat(0.5,1);
        const entity = new Entity(fixedData,dynamicData,entityData.miscData,entityData.managingStruct);
        const npc =  new NPC(entity);
        npc._entity._groupID = groupIDs.npc;
        npc._entity.incEntityCount('NPC');
        return npc
    }
    public createDefault(entityData:FullEntityData):EntityContract {
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return {_entity:entity}
    }
}
export const entityFactory:Singleton<EntityFactory> = EntityFactory.instance;