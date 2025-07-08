import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import {v4 as uniqueID} from "uuid";
import { UniqueList } from "./unique-list";

export interface EntityLike extends Controller {
    health:Health
}
export interface RelationshipTree {
    attack:Record<string,UniqueList<EntityLike>| null>
}
type Singleton<T> = T;

export const groupIDs = {
    player:uniqueID(),
    enemy:uniqueID(),
    npc:uniqueID()
}
export class RelationshipManager {
    private static manager:RelationshipManager;
    private static relationships:RelationshipTree = {
        attack: {}
    }

    private constructor() {};
    public static get instance():RelationshipManager {
        if (!RelationshipManager.manager)  {
            RelationshipManager.manager = new RelationshipManager();
            Object.values(groupIDs).forEach(value=>{
                RelationshipManager.relationships.attack[value] = new UniqueList()
            })
        }
        return RelationshipManager.manager;
    }

    get attackersOf() {
        return RelationshipManager.relationships.attack
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;