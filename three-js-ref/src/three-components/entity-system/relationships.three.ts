import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import {v4 as uniqueID} from "uuid";
import { UniqueHeap } from "./unique-heap";//the unique heap is just built on top of an existing heap implementation but with O(1) membership test to prevent duplicate entries


export interface EntityLike extends Controller {
    health:Health,
    _attackDamage:number,
    _knockback:number
}
export interface SubBranches {//i built individual heaps for each prop at creation time because changing the props dynamically at runtime involves rebuilding the heap which is very expensive especially when there are multiple entities in the world querying for all sorts of data
    byHealth:UniqueHeap<EntityLike>,//this queries for an entity by their health
    byAttackDamage:UniqueHeap<EntityLike>,//this is query by attack damage
    byKnockback:UniqueHeap<EntityLike>//this is query by knockback
}
type SubBranch = 'byHealth' | 'byAttackDamage' | 'byKnockback';


export interface RelationshipTree {
    attack:Record<string,SubBranches>
}
type Singleton<T> = T;

export const groupIDs = {//i intended to define this in the entity manager but i couldnt do so without running into cyclic imports
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
            
            Object.values(groupIDs).forEach(groupID=>{//this sets up all the relationships.setting up the data structures at creation time saves performance for the rest of the gameplay
                RelationshipManager.relationships.attack[groupID] = {
                    byHealth:new UniqueHeap((a,b)=>b.health.value - a.health.value),
                    byAttackDamage:new UniqueHeap((a,b)=>b._attackDamage - a._attackDamage),
                    byKnockback:new UniqueHeap((a,b)=>b._knockback - a._knockback)
                }
            })
        }
        return RelationshipManager.manager;
    }
    public addRelationship(entityLike:EntityLike,subBranches:SubBranches) {//adding and removing items to and from the heap is O(logn) and since im doing this for each branch,it means that adding relatioships in my code is O(nlogn).The same for removing relationships.it means that the cost to add or remove a relationship increases as the number of branches grow.
        (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
            subBranches[branch].add(entityLike);
        })
    }
    public removeRelationship(entityLike:EntityLike,subBranches:SubBranches) {//entities must remove their relationships upon death to prevent unexpected behaviour from the entities and to prevent memory leaks
        (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
            subBranches[branch].remove(entityLike);
        })
    }
    get attackerOf() {
        return RelationshipManager.relationships.attack
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;
