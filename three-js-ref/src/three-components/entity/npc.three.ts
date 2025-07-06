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
        return 'idle'
    }
    private updateInternalState() {
        this.entity._state.behaviour = 'patrol'
    }
    get _entity() {
        return this.entity
    }
}