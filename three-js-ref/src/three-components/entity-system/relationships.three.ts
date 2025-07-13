import { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import Heap from "heap-js";
import { groupIDs } from "./globals";

//im not going to explain the structure or how it works cuz its evident from the code.the more important question which is why i chose to use a reference tree instead of a graph is because linear data flow is easier to preduct than a bidirectional one as seen in a graph

type Singleton<T> = T;
type SubQuery = 'byHealth' | 'byAttackDamage' | 'byKnockback' | 'byThreat';
type RelationshipNode = 'attack' | 'enemy';//add more relationships here as a union


export interface EntityLike extends Controller {//this type is the common properties of both the player and entity classes to allow polymorphism
    _groupID:string | null,
    health:Health,//the health here is public to allow mutations from other entities like giving it damage
    _attackDamage:number,
    _knockback:number
}
export interface SubQueries {//i built individual heaps for each prop at creation time because changing the props dynamically at runtime involves rebuilding the heap which is very expensive especially when there are multiple entities in the world querying for all sorts of data
    byHealth:Heap<EntityLike>,//this queries for an entity by their health
    byAttackDamage:Heap<EntityLike>,//this is query by attack damage
    byKnockback:Heap<EntityLike>,//this is query by knockback
    byThreat:Heap<EntityLike>
}

type RelationshipID = string;
export interface RelationshipData {
    totalMembers:number//used to keep track of all entities in a relationship for a specific key
    set:Set<EntityLike>//used to prevent duplicate entries ensuring that relationships for this key from any entity is only added once
    subQueries:SubQueries
}
type Relationship = Record<RelationshipID,RelationshipData>

interface RelationshipTree {
    attack:Relationship,
    enemy:Relationship
}


export class RelationshipManager {
    private static manager:RelationshipManager;
    private static relationships:RelationshipTree = {
        attack: {},
        enemy:{}
    }

    private constructor() {};
    public static get instance():RelationshipManager {
        if (!RelationshipManager.manager)  {
            RelationshipManager.manager = new RelationshipManager();
            //this automates the creation of the relationship structure for each sub branch for each groupID for each relationship.The reason why i didnt automate the subranches but made it more explicit is because each sub branch uses a dofferent property to build the heap
            (Object.keys(RelationshipManager.relationships) as RelationshipNode[]).forEach(node=>{
                const relationship:Relationship = RelationshipManager.relationships[node];
                Object.values(groupIDs).forEach(groupID=>{//this sets up all the relationships.setting up the data structures at creation time saves performance for the rest of the gameplay
                    relationship[groupID] = {
                        totalMembers:0,
                        set:new Set(),//its important to localize membership tests to per record cuz if i used a global set like before,an entity will be preented from having multiple relationships
                        subQueries: {//these heaps prioritize higher property values over lower ones.if one needs to query for the lowest value,they can pass an explicit parameter to a helper method defined in common behaviour that validates targets in the specified order--highest or lowest
                            byHealth:new Heap((a,b)=>b.health.value - a.health.value),
                            byAttackDamage:new Heap((a,b)=>b._attackDamage - a._attackDamage),
                            byKnockback:new Heap((a,b)=>b._knockback - a._knockback),
                            byThreat:new Heap((a,b)=>RelationshipManager.computeThreat(b)-RelationshipManager.computeThreat(a))
                        }
                    }
                })
            })
        }
        return RelationshipManager.manager;
    }
    //this operation is O(logn) given that the number of sub queries are manageable
    public addRelationship(entityLike:EntityLike,data:RelationshipData) {
        const set = data.set;
        if (!set.has(entityLike)) {
            console.log('added a relationship');
            set.add(entityLike);
            data.totalMembers += 1;
            (Object.keys(data.subQueries) as SubQuery[]).forEach(query=>{
                data.subQueries[query].add(entityLike);
            })
        }
    }
    //This is pure O(1)

    //entities must remove their relationships upon death to prevent unexpected behaviour from the entities and to prevent memory leaks
    public removeFromRelationship(entityLike:EntityLike,data:RelationshipData) {
        const set = data.set;
        if (set.has(entityLike)) {//this is for safety
            data.totalMembers -= 1;
            console.log('removed a relationship');
            RelationshipManager.clearOnZeroMembers(data);
        }
    }
    //This is O(1) as long as the number of sub queries are manageable.

    //not only does this prevent memory leaks like eager removal but it also saves perf by batching deletes till when all entities in a relationship have died.it doesnt delete eagerly this time but rather,it clears everything in one go.
    private static clearOnZeroMembers(data:RelationshipData) {//i have to make this static because the remove rel references i created in the concretes dont have the this context to call it.
        const set = data.set;
        const totalMembers = data.totalMembers;
        if (totalMembers == 0) {
            set.clear();
            (Object.keys(data.subQueries) as SubQuery[]).forEach(query=>{
                data.subQueries[query].clear();//clear each of the heaps to prevent memory leaks and unexpected entity behaviour in game
            })
            console.log('cleared relationships');
        }
    }
    private static computeThreat(entity: EntityLike): number {
        //balance these weights accordingly.they must sum to 1.
        const healthWeight = 0.5;
        const attackDamageWeight = 0.3;
        const knockbackWeight = 0.2;

        const healthThreat = 1 / (entity.health.value + 1);//we are making the health inversely proportional to the threat level
        return (
          (healthWeight * healthThreat) +
          (attackDamageWeight * entity._attackDamage) +
          (knockbackWeight * entity._knockback)
        );
    }
    get attackerOf() {
        return RelationshipManager.relationships.attack
    }
    get enemyOf() {
        return RelationshipManager.relationships.enemy
    }
}
export const relationshipManager:Singleton<RelationshipManager> = RelationshipManager.instance;
