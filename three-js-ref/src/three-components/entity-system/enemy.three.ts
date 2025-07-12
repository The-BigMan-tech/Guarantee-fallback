import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";
import type { SubBranches } from "./relationships.three";
import { groupIDs } from "./groupIDs";

export class Enemy implements EntityContract  {
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private selfToPlayerRelationship:SubBranches = relationshipManager.attackerOf[groupIDs.player];
    private addRelationship = relationshipManager.addRelationship;
    private removeRelationship = relationshipManager.removeRelationship;


    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.commonBehaviour.attackBehaviour()) {
            this.addRelationship(this.entity,this.selfToPlayerRelationship)
            return 'attack'
        }else return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        const currentTarget = relationshipManager.attackerOf[groupIDs.enemy].byAttackDamage.bottom().at(0);//this means that the enemy should attack the entity that attacked its kind with the weakest attack damage
        if (this.commonBehaviour.patrolBehaviour(null)) {
            return
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.removeRelationship(this.entity,this.selfToPlayerRelationship)
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget || this.originalTargetEntity)) {
            return
        }
    }
    get _entity() {
        return this.entity
    }
}