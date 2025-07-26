import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager, type EntityLike } from "./relationships.three";
import type { RelationshipData } from "./relationships.three";
import { groupIDs } from "./entity-registry";
import { ItemHolder } from "../item-system/item-holder.three";
import type { ItemID } from "../item-system/behaviour/core/types";
import { itemManager } from "../item-system/item-manager.three";
import { itemIDs } from "../item-system/item-defintions";
import type { degrees, ItemUsageWeight } from "./global-types";
import { choices } from "./choices";
import * as THREE from "three";
import { degToRad, radToDeg } from "three/src/math/MathUtils.js";


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
        const distToTarget = this.entity.position.distanceTo(currentTarget.position);
        const isFacingTarget = this.isFacingTarget(currentTarget.position).isFacingTarget;

        const YDifference = Math.abs(Math.round(currentTarget.position.y - this.entity.position.y));
        console.log('item. YDifference:', YDifference);
        const onSameOrGreaterYLevel = YDifference >= 0;

        const angleDiff = this.getVerticalAngleDiff(currentTarget.position);
        console.log('item. Dist to target: ',distToTarget);
        console.log('item. isFacing:', isFacingTarget);
        console.log('item. angle: ',angleDiff);
        
        if ((distToTarget > 10) && isFacingTarget && (this.entity.obstDistance === Infinity) && onSameOrGreaterYLevel) {
            console.log('item. going to throw');
            const itemID:ItemID = choices<ItemID>(this.entityItemIDs,this.usageWeights,1)[0];
            const item = itemManager.items[itemID];
            this.itemHolder.holdItem(item);
            if (this.entity.useItemTimer > this.entity.useItemCooldown) {
                const view = new THREE.Group()
                view.position.copy(this.entity.position);
                view.quaternion.copy(this.entity.char.quaternion).multiply(this.isFacingTarget(currentTarget.position).lookAtQuat)
                view.position.y += this.entity.height ;
                view.quaternion.x += degToRad(angleDiff);

                item.behaviour.use({
                    view,
                    itemID:itemID,
                    owner:this.entity,
                    userStrength:this.entity.strength,
                    userHorizontalQuaternion:this.entity.char.quaternion
                })
                this.entity.useItemTimer = 0;
            }
        }else {
            this.itemHolder.holdItem(null);
        }
    }
    private isFacingTarget(targetPos:THREE.Vector3) {
        const dirToTarget = new THREE.Vector3().subVectors(targetPos,this.entity.position).normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.char.quaternion).normalize();

        const flatForward = forward.clone().setY(0).normalize();
        const flatDirToTarget = dirToTarget.clone().setY(0).normalize();

        const dot = flatForward.dot(flatDirToTarget)
        const angle = Math.acos(dot); // angle in radians.it ranges from -1 to 1
        const facingThreshold = THREE.MathUtils.degToRad(15); // e.g., 15 degrees
        const isFacingTarget = angle < facingThreshold;

        const lookAtQuat = new THREE.Quaternion().setFromUnitVectors(forward, dirToTarget);
        return {isFacingTarget,lookAtQuat}
    }
    private getVerticalAngleDiff(targetPos:THREE.Vector3):degrees {
        const dirToTarget = new THREE.Vector3().subVectors(targetPos,this.entity.position);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.entity.char.quaternion).normalize();
        
        const forwardYZ = new THREE.Vector3(0, forward.y, forward.z).normalize();
        const dirYZ = new THREE.Vector3(0, dirToTarget.y, dirToTarget.z).normalize();
        
        let angle = forwardYZ.angleTo(dirYZ); // Angle in radians (0 to PI)

        const cross = new THREE.Vector3().crossVectors(forwardYZ, dirYZ);
        const sign = Math.sign(cross.x); // +1 means target is above, -1 below
        
        angle = angle * sign;
        return Math.round(radToDeg(angle));
    }
    get _entity() {
        return this.entity
    }
}