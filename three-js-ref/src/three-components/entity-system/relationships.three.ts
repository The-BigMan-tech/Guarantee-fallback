import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import {v4 as uniqueID} from "uuid";
import { UniqueHeap } from "./unique-heap";


export interface EntityLike extends Controller {
    health:Health,
    _attackDamage:number,
    _knockback:number
}
interface SubBranches {
    byHealth:UniqueHeap<EntityLike>,
    byAttackDamage:UniqueHeap<EntityLike>,
    byKnockback:UniqueHeap<EntityLike>
}
export interface RelationshipTree {
    attack:Record<string,SubBranches>
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
                RelationshipManager.relationships.attack[value] = {
                    byHealth:new UniqueHeap((a,b)=>b.health.value - a.health.value),
                    byAttackDamage:new UniqueHeap((a,b)=>b._attackDamage - a._attackDamage),
                    byKnockback:new UniqueHeap((a,b)=>b._knockback - a._knockback)
                }
            })
        }
        return RelationshipManager.manager;
    }
    get isAnAttackerOf() {
        return RelationshipManager.relationships.attack
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;
