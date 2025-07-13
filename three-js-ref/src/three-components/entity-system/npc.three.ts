import { player } from "../player/player.three";
import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike, RelationshipData } from "./relationships.three";
import { groupIDs } from "./globals";
import Heap from "heap-js";



export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private trackedRelationships:Set<RelationshipData> = new Set();
    private selfToTargetRelationship:RelationshipData | null = null;//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    
    private attackersOfPlayer = relationshipManager.attackerOf[groupIDs.player];
    private enemiesOfPlayer = relationshipManager.enemyOf[groupIDs.player];
    private attackersOfEntityKind = relationshipManager.attackerOf[groupIDs.npc];

    private addRelationship = relationshipManager.addRelationship;
    private removeFromRelationship = relationshipManager.removeFromRelationship;

    constructor(entity:Entity) {
        this.entity = entity;
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
        this.commonBehaviour = new CommonBehaviour(entity)
    }
    private getAttackRelationshipForGroup(targetGroupID: string): RelationshipData {
        return relationshipManager.attackerOf[targetGroupID];
    }
    private clearTrackedRelationships() {//only call this once per entity ideally on death.since it uses lazy removal that decrements a count till a whole some clearing of a shared heap instead of granular deletion which is costly perf wise,its unsafe to call this method more than once per entity's lifecycle
        for (const relationship of this.trackedRelationships) {
            this.removeFromRelationship(this.entity,relationship);
        }
        this.trackedRelationships.clear();
    }
    private getValidHostileTarget(heap:Heap<EntityLike>): EntityLike | null {
        const bottom = heap.bottom();
        for (let i = 0; i < bottom.length; i++) {
            const candidate = bottom[i]; 
            if (
                (candidate !== this.entity) && //to prevent a loop where it targets itself
                !(candidate.health.isDead) && //to prevent it from targetting dead entities that still linger in the heap because other members for that reationship still remain
                (candidate._groupID !== groupIDs.npc)//to prevent it from targetting its own kind
                ) {
                return candidate;
            }
        }
        return null;
    }
    private onTargetReached():'attack' | 'idle' {
        if (this.commonBehaviour.attackBehaviour()) {
            if (this.selfToTargetRelationship) {
                this.addRelationship(this.entity,this.selfToTargetRelationship);
            }
            return 'attack'
        };
        return 'idle';
    }
    private updateInternalState() {
        let currentTarget:EntityLike | null = (
            this.getValidHostileTarget(this.attackersOfEntityKind.subQueries.byHealth) ||
            this.getValidHostileTarget(this.attackersOfPlayer.subQueries.byHealth) ||
            this.getValidHostileTarget(this.enemiesOfPlayer.subQueries.byHealth) ||
            null
        )

        if (currentTarget) {//i added the health chech to fix that prob where the npc may be chasing a dead target beacuse of lazy relationship removal
            this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!);
            this.trackedRelationships.add(this.selfToTargetRelationship)   
        }else if (this.originalTargetEntity) {//this branch wont execute cuz the npc unlike the enemy doesnt get a target by default but its to remain consistent with the pattern i used for the enemy and it has to respect that this property exists even if its null
            currentTarget = this.originalTargetEntity
            this.selfToTargetRelationship = this.getAttackRelationshipForGroup(currentTarget._groupID!);
            this.trackedRelationships.add(this.selfToTargetRelationship)
        }

        console.log('relationship. Npc is attacking: ',currentTarget?._groupID);

        if (this.commonBehaviour.patrolBehaviour(player.position)) {
            return;
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.clearTrackedRelationships();
            return
        }
        if (this.commonBehaviour.chaseBehaviour(currentTarget)) {
            return;
        }
    }
    get _entity() {
        return this.entity
    }
}