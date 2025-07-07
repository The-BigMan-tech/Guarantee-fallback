import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";

export class Enemy implements EntityContract  {
    private entity:Entity;
    public static modelPath:string = "./silvermoon.glb";

    private temporaryTarget:EntityLike | null = null;
    private endTargetEntity:EntityLike | null;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
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

        this.temporaryTarget = relationshipManager.attackRelationship.attackedEnemy
        if (this.temporaryTarget) {
            this.entity._targetEntity = this.temporaryTarget
        }else {
            this.entity._targetEntity = this.endTargetEntity
        }

        if (this.entity._targetEntity && this.entity._targetEntity.health) {
            if (this.entity._targetEntity.health.isDead) {
                this.entity._state.behaviour = 'patrol';
                return;
            }
            else if (!this.entity._targetEntity.health.isDead) {
                this.entity._navPosition = this.entity._targetEntity.position
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