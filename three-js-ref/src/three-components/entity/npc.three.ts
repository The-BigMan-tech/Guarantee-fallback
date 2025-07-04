import { Entity } from "./entity.three";

export class NPCBehaviour  {
    private entity:Entity
    constructor(entity:Entity) {
        this.entity = entity
    }
    get npc() {
        return this.entity
    }
}