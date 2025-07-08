import { Entity, type EntityContract } from "./entity.three";
import { groupIDs, relationshipManager, type EntityLike } from "./relationships.three";


export class Enemy implements EntityContract  {
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private endTargetEntity:EntityLike | null;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.endTargetEntity = this.entity._targetEntity;
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            relationshipManager.attackersOf[groupIDs.player]!.add(this.entity);//the relationship was poperly intialized by the manager when it was created so this is safe and if its not intialized,i will like an error than a silent failure that would have happened if i used optional chaining
            return 'attack';
        }
        return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackersOf[groupIDs.player]!.delete(this.entity)
            return;
        }

        const targets  = relationshipManager.attackersOf[groupIDs.enemy];
        const lastTarget = targets?.last() || null;
        console.log('attack. enemy:', targets?.length);

        if (lastTarget) {
            this.entity._targetEntity = lastTarget
        }else {
            this.entity._targetEntity = this.endTargetEntity
        }

        if (this.entity._targetEntity && this.entity._targetEntity.health) {
            if (this.entity._targetEntity.health.isDead) {
                this.entity._state.behaviour = 'patrol';
                return;
            }
            else if (!this.entity._targetEntity.health.isDead) {
                this.entity._navPosition = this.entity._targetEntity.position
                this.entity._movementType = 'precise';
                this.entity._state.behaviour = 'chase';
                return;
            }
        }
    }
    get _entity() {
        return this.entity
    }
}