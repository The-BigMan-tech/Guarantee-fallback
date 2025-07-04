import { Entity } from "./entity.three";

export class EnemyBehaviour  {
    private entity:Entity
    constructor(entity:Entity) {
        this.entity = entity
    }
    get enemy() {
        return this.entity
    }
}