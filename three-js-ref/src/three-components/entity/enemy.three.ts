import { Entity, type EntityContract } from "./entity.three";

export class Enemy implements EntityContract  {
    private entity:Entity;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
    }
    private onTargetReached() {//the behaviour when it reaches the target will be later tied to a state machine
        console.log("Agent has reached target");
        if (this.entity._targetHealth && !this.entity._targetHealth.isDead) {
            this.entity._state.behaviour = 'attack';
            this.entity._spaceTarget = true;
            this.entity._lockTheState();
        }
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        console.log("Health. Entity: ",this.entity._health.value);
        switch(true) {//the order of the branches show update priority
            case this.entity._health.isDead: {
                this.entity._state.behaviour = 'death';
                break;
            }
            case (this.entity._targetHealth && this.entity._targetHealth.isDead): {
                this.entity._state.behaviour = 'patrol';
                break;
            }
            case (this.entity._targetHealth && !this.entity._targetHealth.isDead): {
                if (this.entity._targetController) {
                    this.entity._navPosition = this.entity._targetController.position;
                    console.log(' :33 => case => _navPosition:', this.entity._navPosition);
                    this.entity._movementType = 'precise';
                    this.entity._state.behaviour = 'chasing';
                    break;
                }
            }
        }
        console.log("Transition: ",this.entity._state);
    }
    get _entity() {
        return this.entity
    }
}