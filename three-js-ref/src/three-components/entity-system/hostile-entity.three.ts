import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";
import type { RelationshipData } from "./relationships.three";
import { groupIDs } from "./entity-registry";
import { ItemHolder } from "../item-system/item-holder.three";
import type { ItemID } from "../item-system/behaviour/core/types";
import { itemManager } from "../item-system/item-manager.three";
import { itemIDs } from "../item-system/item-defintions";
import type { ItemUsageWeight } from "./global-types";
import { choices } from "./choices";


export class HostileEntity implements EntityContract  {
    private entityItems:Record<ItemID,ItemUsageWeight> = {
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
    private itemHolder:ItemHolder;

    private entityItemIDs:ItemID[] = [];
    private usageWeights:ItemUsageWeight[] = [];

    constructor(entity:Entity) {
        this.commonBehaviour = new CommonBehaviour(entity);//this creates a proxy to update its records in its respecive heaps
        this.entity = this.commonBehaviour.entity;//use the proxied entity
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
        this.itemHolder = new ItemHolder(this.entity.item3D);
        Object.keys(this.entityItems).forEach(entityItemID=>{
            this.entityItemIDs.push(entityItemID);
            this.usageWeights.push(this.entityItems[entityItemID]);
        })
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
            const distToTarget = this.entity.position.distanceTo(currentTarget.position);
            console.log('item. Dist to target: ',distToTarget);
            if (distToTarget > 10) {
                const itemID:ItemID = choices<ItemID>(this.entityItemIDs,this.usageWeights,1)[0];
                const item = itemManager.items[itemID];
                this.itemHolder.holdItem(item);
            }
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
    get _entity() {
        return this.entity
    }
}