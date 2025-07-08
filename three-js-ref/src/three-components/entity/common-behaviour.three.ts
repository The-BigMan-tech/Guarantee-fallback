import type { Entity } from "./entity.three";
import { relationshipManager } from "./relationships.three";

export class CommonBehaviour {
    private entity:Entity;

    constructor(entity:Entity) {
        this.entity = entity
    }
    public deathBehaviour(attackRelatioshipID:string) {
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            relationshipManager.attackersOf[attackRelatioshipID]!.delete(this.entity)
            return;
        }
    }
}