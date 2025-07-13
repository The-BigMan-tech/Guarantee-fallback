import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike, RelationshipData } from "./relationships.three";
import { groupIDs } from "./globals";



export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private trackedRelationships:Set<RelationshipData> = new Set();
    private selfToTargetRelationship:RelationshipData | null = null;//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    
    private attackersOfPlayer = relationshipManager.attackerOf[groupIDs.player];
    private attackersOfNPC = relationshipManager.attackerOf[groupIDs.npc];

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
    private clearTrackedRelationships() {//only call this once per entity ideally on death.since it uses lazy removal that decrements a count till a whole some clearing of a shared heap instead of granular deletion which is costly perf wise,its unsafe to call this method more than once per entity's lifecycle
        for (const relationship of this.trackedRelationships) {
            this.removeFromRelationship(this.entity,relationship);
        }
        this.trackedRelationships.clear();
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.commonBehaviour.attackBehaviour()) {
            if (this.selfToTargetRelationship) {
                this.addRelationship(this.entity,this.selfToTargetRelationship);
            }
            return 'attack'
        };
        return 'idle';
    }
    private updateInternalState() {
        let currentTarget = 
                this.attackersOfPlayer.subQueries.byHealth.bottom().at(0) || 
                this.attackersOfNPC.subQueries.byHealth.bottom().at(0) ||
                null;

        if (currentTarget && !currentTarget.health.isDead) {//i added the health chech to fix that prob where the npc may be chasing a dead target beacuse of lazy relationship removal
            if (currentTarget._groupID === groupIDs.npc) {//this means that it should not target its own kind
                currentTarget = null;
                this.selfToTargetRelationship = null; // reset because no valid target
                this.trackedRelationships.add(this.attackersOfPlayer)//we want to add this to the set for removal from the attacker of player relationship since its not meant to attack the player.im not adding the currentTarget.groupId cuz the npc shouldnt be an attacker of its own kind
            }else {
                this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!);
                this.trackedRelationships.add(this.selfToTargetRelationship)
            }
        }else if (this.originalTargetEntity) {//this branch wont execute cuz the npc unlike the enemy doesnt get a target by default but its to remain consistent with the pattern i used for the enemy
            currentTarget = this.originalTargetEntity
            this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!);
            this.trackedRelationships.add(this.selfToTargetRelationship)
        }


        if (this.commonBehaviour.patrolBehaviour(player.position)) {
            return;
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.clearTrackedRelationships();
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget)) {
            return;
        }
    }
    get _entity() {
        return this.entity
    }
}