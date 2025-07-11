import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import {v4 as uniqueID} from "uuid";
import { UniqueHeap } from "./unique-heap";


export interface EntityLike extends Controller {
    health:Health,
    _attackDamage:number,
    _knockback:number
}
export interface SubBranches {
    byHealth:UniqueHeap<EntityLike>,
    byAttackDamage:UniqueHeap<EntityLike>,
    byKnockback:UniqueHeap<EntityLike>
}
type SubBranch = 'byHealth' | 'byAttackDamage' | 'byKnockback';


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
            Object.values(groupIDs).forEach(groupID=>{
                RelationshipManager.relationships.attack[groupID] = {
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
    public addRelationship(entityLike:EntityLike,subBranches:SubBranches) {
        (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
            subBranches[branch].add(entityLike);
        })
    }
    public removeRelationship(entityLike:EntityLike,subBranches:SubBranches) {
        (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
            subBranches[branch].remove(entityLike);
        })
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;
