import type { Entity } from "./entity.three";
import * as THREE from "three"
import type { EntityLike } from "./relationships.three";
import { relationshipManager,type RelationshipData } from "./relationships.three";
import Heap from "heap-js";

export class CommonBehaviour {
    private entity:Entity;
    private removeFromRelationship = relationshipManager.removeFromRelationship;

    constructor(entity:Entity) {
        this.entity = entity
    }
    public patrolBehaviour(basePatrolPoint:THREE.Vector3 | null):boolean {
        this.entity.basePatrolPoint = basePatrolPoint
        this.entity._state.behaviour = 'patrol';
        return false;
    }
    public deathBehaviour():boolean {
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            return true;
        }
        return false;
    }
    public chaseBehaviour(target:EntityLike | null):boolean {
        this.entity._targetEntity = target;
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            this.entity._navPosition = this.entity._targetEntity.position;
            this.entity._movementType = 'precise';
            this.entity._state.behaviour = 'chase';
            return true;
        }
        return false;
    }
    public attackBehaviour():boolean {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            return true;
        }
        return false;
    }
    public clearTrackedRelationships(trackedRelationships:Set<RelationshipData>) {//only call this once per entity ideally on death.since it uses lazy removal that decrements a count till a whole some clearing of a shared heap instead of granular deletion which is costly perf wise,its unsafe to call this method more than once per entity's lifecycle
        for (const relationship of trackedRelationships) {
            this.removeFromRelationship(this.entity,relationship);
        }
        trackedRelationships.clear();
    }
    public getValidHostileTarget(heap:Heap<EntityLike>,order:'highest' | 'lowest'): EntityLike | null {
        const candidates = order === 'highest' ? heap.top() : heap.bottom();
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i]; 
            if (
                (candidate !== this.entity) && //to prevent a loop where it targets itself
                !(candidate.health.isDead) && //to prevent it from targetting dead entities that still linger in the heap because other members for that reationship still remain
                (candidate._groupID !== this.entity._groupID)//to prevent it from targetting its own kind
                ) {
                return candidate;
            }
        }
        return null;
    }
}