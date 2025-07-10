import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { groupIDs, relationshipManager, type EntityLike } from "./relationships.three";


export class Enemy implements EntityContract  {
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private endTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        const shouldAttack = this.commonBehaviour.attackBehaviour(groupIDs.player);
        if (shouldAttack) return 'attack';
        return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        let shouldReturn:boolean = false;

        shouldReturn = this.commonBehaviour.patrolBehaviour(null);
        if (shouldReturn) return;

        shouldReturn = this.commonBehaviour.deathBehaviour(groupIDs.player);
        if (shouldReturn) return;

        const targets = relationshipManager.attackersOf[groupIDs.enemy]!;
        this.entity._targetEntity = targets.top()[0] || this.endTargetEntity;

        shouldReturn = this.commonBehaviour.chaseBehaviour();
        if (shouldReturn) return;
    }
    get _entity() {
        return this.entity
    }
}