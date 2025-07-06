import { Entity } from "./entity.three";

export class NPC  {
    public static modelPath:string = './snowman-v3.glb';
    private entity:Entity;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.entity._targetHealth && !this.entity._targetHealth.isDead) {
            return 'attack';
        }
        return 'idle'
    }
    private updateInternalState() {
        this.entity._state.behaviour = 'patrol';
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            return;
        }
        else if (this.entity._targetHealth) {
            if (!this.entity._targetHealth.isDead && this.entity._targetController) {
                this.entity._navPosition = this.entity._targetController.position;
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