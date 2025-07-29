import type { Entity } from "./entity.three";
import * as THREE from "three"
import type { EntityLike } from "./relationships.three";
import { relationshipManager,type RelationshipData } from "./relationships.three";
import Heap from "heap-js";
import type { degrees, EntityItems, ItemUsageWeight } from "./global-types";
import { degToRad, radToDeg } from "three/src/math/MathUtils.js";
import type { Item, ItemID } from "../item-system/behaviour/core/types";
import { ItemHolder } from "../item-system/item-holder.three";
import { itemManager } from "../item-system/item-manager.three";
import { choices } from "./choices";

type EntityKeys = keyof Entity


export interface EntityItemUsage {
    view:THREE.Group,
    itemID:ItemID,
    item:Item,
    strength:number
}
export interface ItemWithID {
    item:Item,
    itemID:ItemID
}
class EntityVecUtils {
    public static distanceXZ(a: THREE.Vector3Like, b: THREE.Vector3Like): number {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt((dx * dx) + (dz * dz));
    }
    public static getDirToTarget(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3) {
        const dirToTarget = new THREE.Vector3().subVectors(targetPos,srcPos).normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(srcQuat).normalize();
        return {forward,dirToTarget}
    }
    public static getVerticalAngleDiff(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):degrees {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(srcQuat).normalize();
        const dirToTarget = new THREE.Vector3().subVectors(targetPos, srcPos).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);

        const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
        const dirOnVerticalPlane = dirToTarget.clone().sub(right.clone().multiplyScalar(dirToTarget.dot(right))).normalize();
        let angle = forward.angleTo(dirOnVerticalPlane); // radians, 0 to PI

        const cross = new THREE.Vector3().crossVectors(forward, dirOnVerticalPlane);
        const sign = Math.sign(cross.dot(right)); // positive means target is above forward vector
        angle = angle * sign;

        return Math.round(radToDeg(angle));
    }
    public static isFacingTargetXZ(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):boolean {
        const {forward,dirToTarget} = EntityVecUtils.getDirToTarget(srcPos,srcQuat,targetPos)
        const flatForward = forward.clone().setY(0).normalize();
        const flatDirToTarget = dirToTarget.clone().setY(0).normalize();

        const dot = flatForward.dot(flatDirToTarget)
        const angle = Math.acos(dot); // angle in radians.it ranges from -1 to 1
        const facingThreshold = THREE.MathUtils.degToRad(15); // e.g., 15 degrees
        const isFacingTarget = angle < facingThreshold;

        return isFacingTarget
    }
    public static getRequiredQuat(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):THREE.Quaternion {
        const {forward,dirToTarget} = EntityVecUtils.getDirToTarget(srcPos,srcQuat,targetPos)
        return new THREE.Quaternion().setFromUnitVectors(forward, dirToTarget);
    }   
    //it gets the velocity that an object must have to be thrown from a src pos to a target with a given throw angle
    public static getThrowVelocity(srcPos:THREE.Vector3,targetPos:THREE.Vector3,angleRad:number) {
        const gravity = 9.8; // or your gravity constant
        const theta = angleRad
        const dist = this.distanceXZ(srcPos,targetPos)   // horizontal distance to target
        const heightDiff = targetPos.y - srcPos.y; // vertical height difference

        const denominator = 2 * Math.pow(Math.cos(theta), 2) * (dist * Math.tan(theta) - heightDiff);
        const initialVelocity = Math.sqrt((gravity * dist * dist) / denominator);
        return initialVelocity;
    } 
}
export class CommonBehaviour {
    public entity:Entity;
    private targetRelationshipToUpdate: RelationshipData | null = null;
    private removeFromRelationship = relationshipManager.removeFromRelationship;
    private itemHolder:ItemHolder;

    private entityItemIDs:ItemID[] = [];
    private usageWeights:ItemUsageWeight[] = [];

    constructor(entity:Entity,entityItems:EntityItems) {
        const proxy = new Proxy(entity, {//used a proxy on the entity to update relevant heaps used in the relationships when its property changes
            set: (target: Entity, prop: EntityKeys, value: unknown) => {
                const descriptor = Object.getOwnPropertyDescriptor(target, prop);
                if (descriptor && !descriptor.writable && descriptor.get && !descriptor.set) {
                    return true;// Property is getter-only, skip assignment
                }
                const oldValue = target[prop];
                if (oldValue === value) {
                    return true;
                };
                // @ts-expect-error The prop is guaranteed to be a writable property at runtime that ts cannot see
                target[prop] = value;
                if (prop === 'currentHealth' || prop === 'attackDamage' || prop === 'knockback') {
                    console.log('Proxy called');
                    if (this.targetRelationshipToUpdate) {
                        const topEntities = this.targetRelationshipToUpdate.subQueries.byHealth.top(3);    // top 3 entities
                        console.log('heap top entities before:', topEntities.map(e =>e.controllerID));
                        relationshipManager.updateRelationship(proxy,this.targetRelationshipToUpdate);
                        console.log('heap top entities after:', topEntities.map(e =>e.controllerID));
                    }
                }
                return true;
            }
        })
        this.entity = proxy;
        this.itemHolder = new ItemHolder(this.entity.item3D);
        Object.keys(entityItems).forEach(entityItemID=>{
            this.entityItemIDs.push(entityItemID);
            this.usageWeights.push(entityItems[entityItemID]);
        })
    }
    public patrolBehaviour(basePatrolPoint:THREE.Vector3 | null):boolean {
        this.entity.basePatrolPoint = basePatrolPoint
        this.entity._state.behaviour = 'patrol';
        return false;
    }
    public deathBehaviour():boolean {
        if (this.entity._health.isDead) {//the order of the branches show update priority
            this.entity._state.behaviour = 'death';
            return true;
        }
        return false;
    }
    public chaseBehaviour(target:EntityLike | null):boolean {
        this.entity._targetEntity = target;
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            this.entity._navPosition = this.entity._targetEntity.position;
            this.entity._movementType = 'precise';
            this.entity._state.behaviour = 'chase';
            return true;
        }
        return false;
    }
    public attackBehaviour():boolean {
        if (this.entity._targetEntity && !this.entity._targetEntity.health.isDead) {
            return true;
        }
        return false;
    }
    public clearTrackedRelationships(trackedRelationships:Set<RelationshipData>) {//only call this once per entity ideally on death.since it uses lazy removal that decrements a count till a whole some clearing of a shared heap instead of granular deletion which is costly perf wise,its unsafe to call this method more than once per entity's lifecycle
        for (const relationship of trackedRelationships) {
            this.removeFromRelationship(this.entity,relationship);
        }
        trackedRelationships.clear();
    }
    public getValidHostileTarget(heap:Heap<EntityLike>,order:'highest' | 'lowest'): EntityLike | null {
        const candidates = order === 'highest' ? heap.top() : heap.bottom();
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i]; 
            if (
                (candidate !== this.entity) && //to prevent a loop where it targets itself
                !(candidate.health.isDead) && //to prevent it from targetting dead entities that still linger in the heap because other members for that reationship still remain
                (candidate._groupID !== this.entity._groupID)//to prevent it from targetting its own kind
                ) {
                return candidate;
            }
        }
        return null;
    }
    public getValidFollowTarget(heap:Heap<EntityLike>,order:'highest' | 'lowest'): EntityLike | null {
        const candidates = order === 'highest' ? heap.top() : heap.bottom();
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i]; 
            if ((candidate !== this.entity) && !(candidate.health.isDead)) {
                return candidate;
            }
        }
        return null;
    }

    public throwItem(itemWithID:ItemWithID,targetPos:THREE.Vector3) {
        const entityPos = this.entity.position;
        const entityQuat = this.entity.char.quaternion;

        const distToTarget = EntityVecUtils.distanceXZ(entityPos,targetPos) 
        const minDist = 15;
        const maxDist = 100;

        const YDifference = Math.round(targetPos.y - this.entity.position.y);
        const onSameOrGreaterYLevel = YDifference >= 0;//i added this check because without using the vertical dist to lock throwing,it can throw through the wall's edge.unless i make the calc consider other pars

        const isFacingTarget = EntityVecUtils.isFacingTargetXZ(entityPos,entityQuat,targetPos);
        const withinAReasonableDist =  (distToTarget >= minDist) && (distToTarget <= maxDist);
        const pathIsClear =  this.entity.obstDistance === Infinity;
        const atObstacleEdge = !this.entity.isThereGroundAhead;
        const shouldThrow = withinAReasonableDist && 
            isFacingTarget && 
            pathIsClear && 
            (onSameOrGreaterYLevel || atObstacleEdge);//the at obstacle edge check enables it to throw downwards
        
        console.log('item. YDifference:', YDifference);
        console.log('item. distToTarget:', distToTarget);

        if (shouldThrow) {
            const parabolicDist = minDist + 10;
            const useParabolicThrow = distToTarget > parabolicDist;//i can always make my entity perform a linear throw and it will always be on taregt but it wont be realistic because people usually aim higher to shoot at a farther target
            const elevationWeight = (useParabolicThrow)?0.5:0.02;
            const elevationHeight = elevationWeight * distToTarget;
            const elevatedTargetPos = targetPos.clone();
            elevatedTargetPos.y += elevationHeight;//i elevated the target pos when deciding to perform a parabolic throw so that the view of the entity naturally looks upwards to this new position even though the target's actual position isnt elevated.

            const angleDiff:degrees = EntityVecUtils.getVerticalAngleDiff(entityPos,entityQuat,elevatedTargetPos);
            const angleDiffRad = degToRad(angleDiff);  

            //Horizontal aiming
            const view = this.getView();
            const flatTargetPos = targetPos.clone().setY(entityPos.y);//By flattening target Y to the entity's own Y coordinate,The direction vector from entity to target becomes truly horizontal in the entity's plane, without unintended vertical tilt.
            view.quaternion.multiply(EntityVecUtils.getRequiredQuat(entityPos,entityQuat,flatTargetPos));//i used a flat pos here because the horizontal aiming (yaw) should be independent of vertical height differences — the target’s XZ position determines the left-right facing direction.By zeroing out Y for getRequiredQuat, the program avoids skewing or twisting the horizontal rotation with vertical height data, ensuring the entity faces correctly on the ground plane.
            
            //vertical aiming
            const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleDiffRad);
            view.quaternion.multiply(pitchQuat);
        
            const parabolicThrowVelocity = EntityVecUtils.getThrowVelocity(entityPos,targetPos,angleDiffRad) ;
            const parabolicForceScalar = 13;
            const parabolicStrength = parabolicThrowVelocity * parabolicForceScalar;

            const forcePerUnitDistance = 20;
            const linearStrength = forcePerUnitDistance * distToTarget
            const strength =  (useParabolicThrow)?parabolicStrength:linearStrength;//no need to clamp because it wont throw when the dist is too far
            
            console.log('item. useParabolicThrow:', useParabolicThrow);
            console.log('item. strength:',strength);
            console.log('item. angleDiff:', angleDiff);
            this.useItem({view,...itemWithID,strength:strength});
        }else {
            this.itemHolder.holdItem(null);
        }
    }
    public selectRandomItem():ItemWithID {
        const itemID:ItemID = choices<ItemID>(this.entityItemIDs,this.usageWeights,1)[0];
        const item = itemManager.items[itemID];
        return {item,itemID}
    }
    private getView():THREE.Group {
        const view = new THREE.Group()
        view.position.copy(this.entity.position);
        view.quaternion.copy(this.entity.char.quaternion)
        view.position.y += this.entity.height ;
        return view
    }
    private useItem(args:EntityItemUsage) {
        this.itemHolder.holdItem(args.item);
        if (this.entity.useItemTimer > this.entity.useItemCooldown) { 
            args.item.behaviour.use({
                view:args.view,
                itemID:args.itemID,
                owner:this.entity,
                userStrength:args.strength,
                userHorizontalQuaternion:this.entity.char.quaternion
            })
            this.entity.useItemTimer = 0;
        }
    }
    public updateOrderInRelationship(target:RelationshipData | null) {
        this.targetRelationshipToUpdate = target;
    }
}