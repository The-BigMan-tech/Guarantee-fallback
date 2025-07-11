import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike } from "./relationships.three";
import { groupIDs } from "./relationships.three";
import type { SubBranches } from "./relationships.three";


export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';
    private entity:Entity;
    private endTargetEntity:EntityLike | null;
    
    private commonBehaviour:CommonBehaviour;

    private selfToEnemyRelationship:SubBranches | null = null;//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    private attackerOf = relationshipManager.attackerOf;

    private addRelationship = relationshipManager.addRelationship;
    private removeRelationship = relationshipManager.removeRelationship;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.commonBehaviour.attackBehaviour()) {
            this.addRelationship(this.entity,this.selfToEnemyRelationship!)
            return 'attack'
        };
        return 'idle';
    }
    private updateInternalState() {
        this.selfToEnemyRelationship = this.attackerOf[groupIDs.enemy];
        
        if (this.commonBehaviour.patrolBehaviour(player.position.clone())) {
            return;
        }

        if (this.commonBehaviour.deathBehaviour()) {
            this.removeRelationship(this.entity,this.selfToEnemyRelationship!)
            return
        }

        const target = this.attackerOf[groupIDs.player].byHealth.bottom();
        this.entity._targetEntity = target || this.endTargetEntity;
        if (this.commonBehaviour.chaseBehaviour()) {
            return;
        }
    }
    get _entity() {
        return this.entity
    }
}