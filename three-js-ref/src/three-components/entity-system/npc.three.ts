import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike, RelationshipData } from "./relationships.three";
import { groupIDs } from "./groupIDs";



export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private selfToEnemyRelationship:RelationshipData = relationshipManager.attackerOf[groupIDs.enemy];//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    private addRelationship = relationshipManager.addRelationship;
    private removeRelationship = relationshipManager.removeRelationship;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.commonBehaviour.attackBehaviour()) {
            this.addRelationship(this.entity,this.selfToEnemyRelationship)
            return 'attack'
        };
        return 'idle';
    }
    private updateInternalState() {        
        let currentTarget:EntityLike | undefined = relationshipManager.attackerOf[groupIDs.player].subQueries.byHealth.bottom().at(0);
        if (currentTarget?._groupID === groupIDs.npc) {//this means that it should not target its own kind
            this.removeRelationship(this.entity,relationshipManager.attackerOf[groupIDs.player])
            currentTarget = undefined
        }
        if (this.commonBehaviour.patrolBehaviour(player.position.clone())) {
            return;
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.removeRelationship(this.entity,this.selfToEnemyRelationship)
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