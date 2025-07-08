import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike } from "./relationships.three";
import { groupIDs } from "./relationships.three";


export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';
    private entity:Entity;
    private endTargetEntity:EntityLike | null;
    
    private commonBehaviour:CommonBehaviour
    
    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {
        const shouldAttack = this.commonBehaviour.attackBehaviour(groupIDs.enemy);
        if (shouldAttack) return 'attack';
        return 'idle';
    }
    private updateInternalState() {
        let shouldReturn:boolean = false;
        shouldReturn = this.commonBehaviour.patrolBehaviour(player.position.clone());
        if (shouldReturn) return;

        shouldReturn = this.commonBehaviour.deathBehaviour(groupIDs.enemy);
        if (shouldReturn) return;

        const targets = relationshipManager.attackersOf[groupIDs.player];
        this.entity._targetEntity = targets!.last() || this.endTargetEntity;

        shouldReturn = this.commonBehaviour.chaseBehaviour();
        if (shouldReturn) return;
    }
    get _entity() {
        return this.entity
    }
}