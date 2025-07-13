import { HostileEntity } from "./hostile-entity.three";
import { NPC } from "./npc.three";
import { randInt,randFloat} from "three/src/math/MathUtils.js";
import { Entity } from "./entity.three";
import type { EntityContract } from "./entity.three";
import type { FullEntityData } from "./entity.three";
import { player } from "../player/player.three";

type Singleton<T> = T;
export class EntityFactory {
    private static factory:EntityFactory;

    private constructor() {};
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
        fixedData.modelPath = HostileEntity.modelPath;
        miscData.targetEntity = player;
        dynamicData.horizontalVelocity = randInt(10,20);
        dynamicData.jumpVelocity = randInt(20,30);
        dynamicData.jumpResistance = Math.min(randInt(6,10),dynamicData.horizontalVelocity-5);//i capped it to be smaller than horizontal velocity cuz if not and it happens to be bigger than the horizontal vel,the entity wont be able to jump because its jump resistance is equal or bigger
        miscData.healthValue = randInt(20,25);
        miscData.knockback = randInt(100,150);
        miscData.attackDamage = randFloat(0.5,1);
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return new HostileEntity(entity);
    }
    public createNPC(entityData:FullEntityData):EntityContract {
        const fixedData = entityData.fixedData;
        const dynamicData = entityData.dynamicData;
        const miscData = entityData.miscData
        fixedData.modelPath = NPC.modelPath;
        dynamicData.horizontalVelocity = randInt(15,30);
        dynamicData.jumpVelocity = randInt(25,32);
        dynamicData.jumpResistance = Math.min(randInt(6,10),dynamicData.horizontalVelocity-5);
        miscData.healthValue = randInt(10,15);
        miscData.knockback = randInt(100,150);
        miscData.attackDamage = randFloat(2,3);
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return new NPC(entity);
    }
    public createDefault(entityData:FullEntityData):EntityContract {
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return {_entity:entity}
    }
}
export const entityFactory:Singleton<EntityFactory> = EntityFactory.instance;