import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { groupIDs, relationshipManager, type EntityLike } from "./relationships.three";
import type { SubBranches } from "./relationships.three";

export class Enemy implements EntityContract  {
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private endTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private selfToPlayerRelationship:SubBranches | null = null;
    private isAnAttackerOf = relationshipManager.isAnAttackerOf;

    private addRelationship = relationshipManager.addRelationship;
    private removeRelationship = relationshipManager.removeRelationship;


    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.commonBehaviour.attackBehaviour()) {
            this.addRelationship(this.entity,this.selfToPlayerRelationship!)
            return 'attack'
        }else return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        this.selfToPlayerRelationship = this.isAnAttackerOf[groupIDs.player];

        if (this.commonBehaviour.patrolBehaviour(null)) {
            return
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.removeRelationship(this.entity,this.selfToPlayerRelationship)
            return
        }
        const target = this.isAnAttackerOf[groupIDs.enemy].byHealth.bottom();
        this.entity._targetEntity = target  || this.endTargetEntity;
        if (this.commonBehaviour.chaseBehaviour()) {
            return
        }
    }
    get _entity() {
        return this.entity
    }
}