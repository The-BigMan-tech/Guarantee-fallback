import { Entity } from "./entity.three";
import { relationshipManager } from "./relationship-manager.three";
import type { RelationshipContract } from "./relationship-manager.three";

export class NPC  {
    public static modelPath:string = './snowman-v3.glb';
    private entity:Entity;

    private endTargetEntity:RelationshipContract | null;
    
    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            relationshipManager.attackRelationship.attackedEnemy = this.entity
            return 'attack';
        }
        return 'idle'
    }
    private updateInternalState() {
        this.entity._state.behaviour = 'patrol';
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackRelationship.attackedEnemy = null;
            return;
        }

        const target = relationshipManager.attackRelationship.attackedPlayer
        if (target) {
            this.entity._targetEntity = target;
        }else {
            this.entity._targetEntity = this.endTargetEntity;
        }

        if (this.entity._targetEntity) {
            this.entity._navPosition = this.entity._targetEntity.position;
            this.entity._movementType = 'precise';
            this.entity._state.behaviour = 'chase';
            return;
        }
    }
    get _entity() {
        return this.entity
    }
}