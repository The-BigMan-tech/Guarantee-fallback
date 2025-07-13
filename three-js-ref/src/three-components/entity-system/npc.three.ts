import { CommonBehaviour } from "./common-behaviour.three";
import { Entity, type EntityContract } from "./entity.three";
import { relationshipManager } from "./relationships.three";
import type { EntityLike, RelationshipData } from "./relationships.three";
import { groupIDs } from "./globals";



export class NPC implements EntityContract {
    public static modelPath:string = './snowman-v3.glb';

    private entity:Entity;
    private originalTargetEntity:EntityLike | null;
    private commonBehaviour:CommonBehaviour;

    private trackedRelationships:Set<RelationshipData> = new Set();
    private selfToTargetRelationship:RelationshipData | null = null;//i used null here to prevent ts from complaining that i didnt initialize this in the constructor and i wanted to avoid code duplication but im sure that it cant be null and thats why i used null assertion in property access
    
    private attackersOfPlayer = relationshipManager.attackerOf[groupIDs.player];
    private attackersOfEntityKind = relationshipManager.attackerOf[groupIDs.npc];
    private enemiesOfPlayer = relationshipManager.enemyOf[groupIDs.player];

    private followTarget:RelationshipData = relationshipManager.followTargetOf[groupIDs.npc]

    private addRelationship = relationshipManager.addRelationship;

    constructor(entity:Entity) {
        this.commonBehaviour = new CommonBehaviour(entity)
        this.entity = this.commonBehaviour.entity;//we want to use the entity from the common behaviour because its a proxy
        this.entity.onTargetReached = this.onTargetReached.bind(this);
        this.entity.updateInternalState = this.updateInternalState.bind(this);
        this.originalTargetEntity = this.entity._targetEntity;
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
        const currentTarget:EntityLike | null = (
            this.commonBehaviour.getValidHostileTarget(this.attackersOfEntityKind.subQueries.byThreat,'highest') ||
            this.commonBehaviour.getValidHostileTarget(this.attackersOfPlayer.subQueries.byThreat,'highest') ||
            this.commonBehaviour.getValidHostileTarget(this.enemiesOfPlayer.subQueries.byThreat,'highest') ||
            this.originalTargetEntity
        )
        if (currentTarget) {//i added the health chech to fix that prob where the npc may be chasing a dead target beacuse of lazy relationship removal
            this.selfToTargetRelationship = relationshipManager.attackerOf[currentTarget._groupID!];//i assert the craetion of group id because the entity manager always intializes this id before saving it to the game for updates
            this.trackedRelationships.add(this.selfToTargetRelationship);
            this.commonBehaviour.updateOrderInRelationship(this.selfToTargetRelationship); 
            console.log('relationship. Npc is attacking: ',currentTarget?._groupID);
        }
        //unlike for hostile target,we dont need to validate for entity's own group or other stuff like that since its just following
        //this is also an inverted or borrowed relationship where the class which is the npc isnt a member of the relationship but rather the key of the record.so it doesnt manage the removal of this relationship and leaves it to peridocial cleanup
        const followTargetEntity = this.followTarget.subQueries.byHealth.top().at(0)
        if (this.commonBehaviour.patrolBehaviour(followTargetEntity?.position || null)) {
            return;
        }
        if (this.commonBehaviour.deathBehaviour()) {
            this.commonBehaviour.clearTrackedRelationships(this.trackedRelationships);
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