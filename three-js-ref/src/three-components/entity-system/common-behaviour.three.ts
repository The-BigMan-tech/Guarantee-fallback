import type { Entity } from "./entity.three";
import * as THREE from "three"
import type { EntityLike } from "./relationships.three";

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
}