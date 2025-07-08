import type { Entity } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import * as THREE from "three"

export class CommonBehaviour {
    private entity:Entity;

    constructor(entity:Entity) {
        this.entity = entity
    }
    public patrolBehaviour(basePatrolPoint:THREE.Vector3 | null):boolean {
        this.entity.basePatrolPoint = basePatrolPoint
        this.entity._state.behaviour = 'patrol';
        return false;
    }
    public deathBehaviour(attackRelatioshipID:string):boolean {
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackersOf[attackRelatioshipID]!.delete(this.entity)
            return true;
        }
        return false;
    }
    public chaseBehaviour():boolean {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            this.entity._navPosition = this.entity._targetEntity.position;
            this.entity._movementType = 'precise';
            this.entity._state.behaviour = 'chase';
            return true;
        }
        return false;
    }
    public attackBehaviour(attackRelatioshipID:string):'attack' | false {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            relationshipManager.attackersOf[attackRelatioshipID]!.add(this.entity)
            return 'attack';
        }
        return false;
    }
}