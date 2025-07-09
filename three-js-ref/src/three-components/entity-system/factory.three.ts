import { Enemy } from "./enemy.three";
import { NPC } from "./npc.three";
import { randInt,randFloat} from "three/src/math/MathUtils.js";
import { Entity } from "./entity.three";
import type { EntityContract } from "./entity.three";
import type { FullEntityData } from "./entity.three";
import { player } from "../player/player.three";

export class EntityFactory {
    private static factory:EntityFactory;

    private constructor() {};
    public static get instance():EntityFactory {
        if (!EntityFactory.factory)  {
            EntityFactory.factory = new EntityFactory();
        }
        return EntityFactory.factory;
    }
    public createEnemy(entityData:FullEntityData):EntityContract {
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
        return new Enemy(entity);
    }
    public createNPC(entityData:FullEntityData):EntityContract {
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
        return new NPC(entity);
    }
    public createDefault(entityData:FullEntityData):EntityContract {
        const entity = new Entity(entityData.fixedData,entityData.dynamicData,entityData.miscData,entityData.managingStruct);
        return {_entity:entity}
    }
}