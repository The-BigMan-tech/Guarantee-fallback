import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike, RelationshipData } from "./relationships.three";
import { groupIDs } from "./groupIDs";
import { randInt } from "three/src/math/MathUtils.js";



export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private selfToTargetRelationship:RelationshipData | null = null;//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    private attackersOfPlayer = relationshipManager.attackerOf[groupIDs.player];

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
        let currentTarget:EntityLike | undefined = this.attackersOfPlayer.subQueries.byHealth.bottom().at(0);
        if (currentTarget && !currentTarget.health.isDead) {//i added the health chech to fix that prob where the npc may be chasing a dead target beacuse of lazy relationship removal
            if (currentTarget._groupID === groupIDs.npc) {//this means that it should not target its own kind
                currentTarget = undefined;
                this.selfToTargetRelationship = null; // reset because no valid target
            }else {
                this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!)
            }
        }

        
        if (this.commonBehaviour.patrolBehaviour(player.position)) {
            return;
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.removeFromRelationship(this.entity,this.attackersOfPlayer);//this explicit removal is needed because the npc already becomeds a player attacker when the player hits it.this goes for other entities and since the player isnt the npc target unlike the enmeis,i cant expect the relationship to be removed by using self to target relationship
            if (this.selfToTargetRelationship) {
                this.removeFromRelationship(this.entity,this.selfToTargetRelationship);
            }
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget || this.originalTargetEntity)) {
            return;
        }
    }
    get _entity() {
        return this.entity
    }
}