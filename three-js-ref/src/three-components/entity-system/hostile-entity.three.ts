import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";
import type { RelationshipData } from "./relationships.three";
import { groupIDs } from "./entity-registry";
import { itemIDs } from "../item-system/item-defintions";
import type { EntityItems } from "./global-types";
import { Throwable } from "../item-system/behaviour/throwable.three";

export class HostileEntity implements EntityContract  {
    private entityItems:EntityItems = {
        [itemIDs.boulder]:10
    }
    public static modelPath:string = "./silvermoon.glb";

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private trackedRelationships:Set<RelationshipData> = new Set();
    private selfToTargetRelationship:RelationshipData | null = null

    private attackersOfEntityKind:RelationshipData = relationshipManager.attackerOf[groupIDs.hostileEntity];
    private originalHostileTarget:RelationshipData = relationshipManager.hostileTargetOf[groupIDs.hostileEntity]

    private addRelationship = relationshipManager.addRelationship;

    constructor(entity:Entity) {
        this.commonBehaviour = new CommonBehaviour(entity,this.entityItems);//this creates a proxy to update its records in its respecive heaps
        this.entity = this.commonBehaviour.entity;//use the proxied entity
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
    }
    private onTargetReached():'attack' | 'idle' {//the behaviour when it reaches the target will be later tied to a state machine
        if (this.commonBehaviour.attackBehaviour()) {
            if (this.selfToTargetRelationship) {
                this.addRelationship(this.entity,this.selfToTargetRelationship);
            }
            return 'attack'
        }else return 'idle';
    }
    private updateInternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        this.originalTargetEntity = this.commonBehaviour.getValidHostileTarget(this.originalHostileTarget.subQueries.byThreat,'highest')
        const currentTarget = (
            this.commonBehaviour.getValidHostileTarget(this.attackersOfEntityKind.subQueries.byAttackDamage,'lowest') || 
            this.originalTargetEntity
        );
        if (currentTarget) {
            //this reads that this entity is an attacker of the target's group
            this.selfToTargetRelationship = relationshipManager.attackerOf[currentTarget._groupID!]
            this.trackedRelationships.add(this.selfToTargetRelationship);
            this.commonBehaviour.updateOrderInRelationship(this.selfToTargetRelationship);
            this.utilizeItem(currentTarget);
            console.log('relationship. hostile entity is attacking: ',currentTarget?._groupID);
        }

        if (this.commonBehaviour.patrolBehaviour(null)) {
            return
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.commonBehaviour.clearTrackedRelationships(this.trackedRelationships);//im clearing this only on death because since im using lazy removal,it will be nsafe to call this on every target switch for a single entity cuz it will destroy the integrity of the data by causing premature clearing of structures
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget)) {
            return
        }
    }
    private utilizeItem(currentTarget:EntityLike) {
        const itemWithID = this.commonBehaviour.selectRandomItem();
        if (itemWithID.item.behaviour instanceof Throwable) {
            this.commonBehaviour.throwItem(itemWithID,currentTarget.position)
        }
    }
    get _entity() {
        return this.entity
    }
}