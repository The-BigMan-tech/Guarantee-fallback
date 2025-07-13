import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";
import type { RelationshipData } from "./relationships.three";
import { groupIDs } from "./globals";

export class Enemy implements EntityContract  {
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private trackedRelationships:Set<RelationshipData> = new Set();
    private selfToTargetRelationship:RelationshipData | null = null

    private attackersOfEnemy:RelationshipData = relationshipManager.attackerOf[groupIDs.enemy];

    private addRelationship = relationshipManager.addRelationship;
    private removeFromRelationship = relationshipManager.removeFromRelationship;


    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private getAttackRelationshipForGroup(targetGroupID: string): RelationshipData {
        return relationshipManager.attackerOf[targetGroupID];
    }
    private clearTrackedRelationships() {
        for (const relationship of this.trackedRelationships) {
            this.removeFromRelationship(this.entity,relationship);
        }
        this.trackedRelationships.clear();
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.commonBehaviour.attackBehaviour()) {
            if (this.selfToTargetRelationship) {
                this.addRelationship(this.entity,this.selfToTargetRelationship);
            }
            return 'attack'
        }else return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        let currentTarget = this.attackersOfEnemy.subQueries.byAttackDamage.bottom().at(0) || null;//this means that the enemy should attack the entity that attacked its kind with the weakest attack damage       
        
        if (currentTarget && !currentTarget.health.isDead) {//i added the health chech to fix that prob where the npc may be chasing a dead target beacuse of lazy relationship removal 
            this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!)//i didn check for the enemy's own kind cuz the target of the enemy will never be the enemy
            this.trackedRelationships.add(this.selfToTargetRelationship);

        }else if (this.originalTargetEntity) {
            currentTarget = this.originalTargetEntity
            this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!);
            this.trackedRelationships.add(this.selfToTargetRelationship);
        }

        if (this.commonBehaviour.patrolBehaviour(null)) {
            return
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.clearTrackedRelationships();//im clearing this only on death because since im using lazy removal,it will be nsafe to call this on every target switch for a single entity cuz it will destroy the integrity of the data by causing premature clearing of structures
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget)) {
            return
        }
    }
    get _entity() {
        return this.entity
    }
}