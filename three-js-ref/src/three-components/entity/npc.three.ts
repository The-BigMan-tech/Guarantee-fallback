import { Entity } from "./entity.three";

export class NPC  {
    private entity:Entity;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
    }
    private onTargetReached():'attack' | 'idle' {
        return 'idle'
    }
    private updateInternalState() {

    }
    get _entity() {
        return this.entity
    }
}