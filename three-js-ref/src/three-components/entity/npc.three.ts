import { player } from "../player/player.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike } from "./relationships.three";
import { groupIDs } from "./relationships.three";


export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';
    private entity:Entity;

    private endTargetEntity:EntityLike | null;
    
    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            relationshipManager.attackersOf[groupIDs.enemy]!.add(this.entity)
            return 'attack';
        }
        return 'idle'
    }
    private updateInternalState() {
        this.entity.basePatrolPoint = player.position.clone();
        this.entity._state.behaviour = 'patrol';

        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackersOf[groupIDs.enemy]!.delete(this.entity)
            return;
        }

        const targets = relationshipManager.attackersOf[groupIDs.player]
        const lastTarget = targets?.last() || null;
        console.log('attack. npc:', targets?.length);

        if (lastTarget) {
            this.entity._targetEntity = lastTarget;
        }else {
            this.entity._targetEntity = this.endTargetEntity;
        }

        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
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