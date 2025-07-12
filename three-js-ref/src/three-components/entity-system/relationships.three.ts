import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import {v4 as uniqueID} from "uuid";
import Heap from "heap-js";

export interface EntityLike extends Controller {
    health:Health,
    _attackDamage:number,
    _knockback:number
}
export interface SubBranches {//i built individual heaps for each prop at creation time because changing the props dynamically at runtime involves rebuilding the heap which is very expensive especially when there are multiple entities in the world querying for all sorts of data
    byHealth:Heap<EntityLike>,//this queries for an entity by their health
    byAttackDamage:Heap<EntityLike>,//this is query by attack damage
    byKnockback:Heap<EntityLike>//this is query by knockback
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
    private static set:Set<EntityLike> = new Set();//i made this a static property to solve the error where the relationship manager methods where accessing the set but it threw an undefined variable error.this happened because i made the enemy and npc classes hold ref to the methods to prevent code redundancy but in doing that,i made them to loose the this context to properly access the set so i had to make it static.if those individual classes had their own set property which im grateful that i didnt add that,it would have led to a bug that not only escapes compile time but also runtime.it will lead to unexpected behaviour in the relationships cuz each entity will be using their own separate set and it will not even be obvious till later in development.so be careful about references.enssure they always point to the correct data
    private static relationships:RelationshipTree = {
        attack: {}
    }

    private constructor() {};
    public static get instance():RelationshipManager {
        if (!RelationshipManager.manager)  {
            RelationshipManager.manager = new RelationshipManager();
            Object.values(groupIDs).forEach(groupID=>{//this sets up all the relationships.setting up the data structures at creation time saves performance for the rest of the gameplay
                RelationshipManager.relationships.attack[groupID] = {
                    byHealth:new Heap((a,b)=>b.health.value - a.health.value),
                    byAttackDamage:new Heap((a,b)=>b._attackDamage - a._attackDamage),
                    byKnockback:new Heap((a,b)=>b._knockback - a._knockback)
                }
            })
        }
        return RelationshipManager.manager;
    }
    //adding and removing items to and from the heap is O(logn) and since im doing this for each branch,it means that adding relatioships in my code is O(nlogn).The same for removing relationships.but since im using a set to prevent duplicate entries through an O(1) membership test,then adding and removing a particular relationship is done only once per entity.making it O(nlogn) only twice per relationship but after that,querying for complex relationships is O(1) 
    public addRelationship(entityLike:EntityLike,subBranches:SubBranches) {
        const set = RelationshipManager.set;
        if (!set.has(entityLike)) {
            set.add(entityLike);
            (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
                subBranches[branch].add(entityLike);
            })
        }
    }
    //entities must remove their relationships upon death to prevent unexpected behaviour from the entities and to prevent memory leaks
    public removeRelationship(entityLike:EntityLike,subBranches:SubBranches) {
        const set = RelationshipManager.set;
        if (set.has(entityLike)) {
            set.delete(entityLike);
            (Object.keys(subBranches) as SubBranch[]).forEach(branch=>{
                subBranches[branch].remove(entityLike);
            })
        }
    }
    get attackerOf() {
        return RelationshipManager.relationships.attack
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;
