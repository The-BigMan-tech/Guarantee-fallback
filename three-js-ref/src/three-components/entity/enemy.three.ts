import type { Controller } from "../controller/controller.three";
import type { Health } from "../health/health";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationship-manager.three";

export class Enemy implements EntityContract  {
    private entity:Entity;
    public static modelPath:string = "./silvermoon.glb";

    private endTargetController:Controller | null;
    private endTargetHealth:Health | null;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetController = this.entity._targetController;
        this.endTargetHealth = this.entity._targetHealth;
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.entity._targetHealth && !this.entity._targetHealth.isDead) {
            relationshipManager.attackRelationship.attackedPlayer = this.entity;
            return 'attack';
        }
        return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackRelationship.attackedPlayer = null;
            return;
        }

        const target = relationshipManager.attackRelationship.attackedEnemy
        if (target) {
            this.entity._targetController = target;
            this.entity._targetHealth = target.health;
        }else {
            this.entity._targetController = this.endTargetController;
            this.entity._targetHealth = this.endTargetHealth;
        }


        if (this.entity._targetHealth) {
            if (this.entity._targetHealth.isDead) {
                this.entity._state.behaviour = 'patrol';
                return;
            }
            else if (!this.entity._targetHealth.isDead && this.entity._targetController) {
                this.entity._navPosition = this.entity._targetController.position;
                this.entity._movementType = 'precise';
                this.entity._state.behaviour = 'chase';
                return;
            }
        }
    }
    get _entity() {
        return this.entity
    }
}