import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as THREE from "three"
import { Health } from "../health/health";
import { combatCooldown, physicsWorld } from "../physics-world.three";
import type { EntityLike } from "./relationships.three";
import { disposeHierarchy, disposeMixer } from "../disposer/disposer.three";
import type { EntityCount,EntityWrapper, seconds} from "./global-types"
import { isEntityWrapper } from "./entity-registry";

type Behaviour = 'idle' | 'patrol' | 'chase' | 'attack' | 'death';
interface EntityStateMachine {
    behaviour:Behaviour
}

export interface EntityMiscData {
    targetEntity:EntityLike | null,
    healthValue:number,
    attackDamage:number,
    knockback:number,
    strength:number
}
export interface EntityContract {
    _entity:Entity
}
export interface ManagingStructure {
    group:THREE.Group,
    entities:EntityContract[],
    entityCounts:EntityCount,
    entityIndexMap:Map<Entity,number>
}
export interface FullEntityData {
    fixedData:FixedControllerData,
    dynamicData:DynamicControllerData,
    miscData:EntityMiscData
    managingStruct:ManagingStructure
}


export class Entity extends Controller implements EntityLike {
    private targetEntity:EntityLike | null = null;
    private groupID:string | null = null;//it states which group of entities does this particular entity belong to.its null intially cuz the group can only be decided at runtime when creating an entity

    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    public health:Health;//the health here is public to allow mutations from other entities like giving it damage
    public currentHealth:number;
    public attackDamage:number;//i made this public for proxy access

    private readonly attackCooldown = combatCooldown; // cooldown duration in seconds
    private attackTimer = 0;    // timer accumulator

    private readonly patrolRadius = 15; // max distance from current position to patrol
    private readonly patrolCooldown = 7; // seconds between patrol target changes
    private patrolTimer = 0;
    public basePatrolPoint:THREE.Vector3 | null = null;//this is meant to be hook where a concrete entity changes where the patrolling is centred around by changing this value.by default its null.so if null,it uses the characterPos as the patrol point else,it uses the provided one.

    private cleanupTimer = 0;
    private readonly cleanupCooldown = 3;//to allow playing an animation before removal
    private isRemoved = false;//to ensure resources are cleaned only once per dead entity

    private struct:ManagingStructure;
    public knockback:number;
    public strength:number;

    private movementType:'fluid' | 'precise' = 'precise'

    public useItemCooldown:seconds = 5;//increase the cooldown accordingly to control the rate at which entities spawn items in the game which indirectly preserves memory
    public useItemTimer:seconds = 0;
    public height:number

    private state:EntityStateMachine = {
        behaviour:'idle'
    }

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:EntityMiscData,struct:ManagingStructure) {
        super(fixedData,dynamicData);
        this.health = new Health(miscData.healthValue);
        this.currentHealth = miscData.healthValue;
        this.targetEntity = miscData.targetEntity
        this.attackDamage = miscData.attackDamage;
        this.struct = struct;
        this.knockback = miscData.knockback;
        this.strength = miscData.strength;
        this.height = fixedData.characterHeight
    }
    private getRandomPatrolPoint(): THREE.Vector3 {
        this.basePatrolPoint ||= this.position.clone();//use char position as base patrol point if none is provided
        const randomPoint = (Math.random() - 0.5) * 2 * this.patrolRadius
        const randomOffset = new THREE.Vector3(randomPoint,0,randomPoint);
        const patrolPoint = this.basePatrolPoint.add(randomOffset);
        this.basePatrolPoint = null;//reset it to null after use to allow it to be hooked,else it wont accept the hooked value in the next frame cuz it will no longer be null by then.
        return patrolPoint;
    }

    private idle():void {
        this.animationControls!.animationToPlay = 'idle'
    }
    private patrol():void {
        if (this.patrolTimer >= this.patrolCooldown) {
            this.navPosition = this.getRandomPatrolPoint();
            this.movementType = "fluid";
            this.patrolTimer = 0;
        }
        this.chase();//navigate towards the patrol point
    }  
    private chase():void {
        if (this.navPosition) {
            const rotateAndMove = (this.movementType == "precise") ? false : true;
            const atTarget = this.navToTarget(this.navPosition,rotateAndMove);
            if (atTarget && this.onTargetReached) {
                const behaviour = this.onTargetReached();
                if (behaviour === 'idle') this.idle();
                else if (behaviour === 'attack') this.attack();
            }
        }
    }
    private attack():void {
        if (!this.targetEntity?.health) return;
        this.attackTimer += this.clockDelta || 0;
        if (this.attackTimer > (this.attackCooldown - this.animationControls!.attackDuration)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.animationControls!.animationToPlay = 'attack'
        }
        if (this.attackTimer > this.attackCooldown) {
            const YSign = Math.sign(this.position.y);
            const srcPosition = this.position.clone();
            srcPosition.y *= -1
            srcPosition.y *= YSign;

            this.targetEntity.knockbackCharacter(srcPosition,this.knockback);
            this.targetEntity.health.takeDamage(this.attackDamage);
            this.attackTimer = 0;
        }
    }
    public death():void {
        if (this.health.isDead && !this.isRemoved) {//I used to have a fadeout function to fade out the animation slowly as the entity dies but the problem is that it mutated the opacity of the materails directly which is fine as long as i reread the gltf file from disk for each entity.but if i only read it once and clone the model,it only clones the model not the material.each model clone even deep ones will still ref the same material in mem for perf.i didnt discover this till i reused models for my item clones.
            this.cleanupTimer += this.clockDelta || 0;
            if (this.cleanupTimer > (this.cleanupCooldown - this.animationControls!.deathDuration)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
                this.animationControls!.animationToPlay = 'death'
                console.log('death. playing death animation');
            }
            this.cleanUpResources();
        }
    }

    public onTargetReached?: () => 'attack' | 'idle';
    public updateInternalState?:()=>void;

    private reactToStateMachine():void {
        console.log("State: ",this.state.behaviour);
        switch (this.state.behaviour) {
            case 'idle': {
                this.idle()
                break;
            }
            case 'patrol': {
                this.patrol();
                break;
            }
            case 'chase': {
                this.chase();
                break;
            }
            case 'attack': {
                this.attack();
                break;
            }
            case 'death': {
                this.death();
                break;
            }
        }
    } 
    public incEntityCount(wrapperName:EntityWrapper) {
        this.struct.entityCounts.totalCount += 1;
        this.struct.entityCounts.individualCounts[wrapperName].currentCount += 1;
    }
    private decEntityCount(wrapperName:EntityWrapper) {
        this.struct.entityCounts.totalCount -= 1;
        this.struct.entityCounts.individualCounts[wrapperName].currentCount -= 1;
        if (Math.sign(this.struct.entityCounts.individualCounts[wrapperName].currentCount) == -1) {
            throw new Error("Unexpected behaviour: The count for this entity is negative");//to prevent silent failures even though it will cause runtime crash
        }
    }
    private checkIfOutOfBounds() {
        if (this.isOutOfBounds) {
            this.health.takeDamage(this.health.value);
        }
    }
    private cleanUpResources():void {
        if (this.cleanupTimer > this.cleanupCooldown) {//the cooldown is here to allow playing of death animations or ending effects
            //Remove the entity from the scene
            this.points.clear();//clear the points array used for visual debugging
            this.struct.group.remove(this.points)//remove them from the scene
            this.struct.group.remove(this.char);//remove the controller from the scene
            
            //Remove the entity from gpu resources
            disposeHierarchy(this.char);//remove the geometry data from the gpu
            if (this.animationControls) {
                this.animationControls.mixer = disposeMixer(this.animationControls.mixer);//to prevent animation updates
            }

            //Remove the entity from internal data structures
            const index = this.struct.entityIndexMap.get(this)!;
            const entityWrapper:EntityContract = this.struct.entities[index];
            const wrapperName:string = entityWrapper.constructor.name
            if (isEntityWrapper(wrapperName)) {//this operation must be done before deletion of the entry
                this.decEntityCount(wrapperName);
            }
            //O(1) deletion from the entities array
            if (index < (this.struct.entities.length - 1)) { // Swap with the last entity if not the last one
                const lastEntity = this.struct.entities[this.struct.entities.length - 1];
                this.struct.entities[index] = lastEntity; // Move last entity to the index of the one being removed
                this.struct.entityIndexMap.set(lastEntity._entity, index); // Update the index map for the moved entity
            }
            this.struct.entities.pop(); // Remove the last element
            this.struct.entityIndexMap.delete(this);// Remove from the index map

            console.log('cleanUp. entities:',this.struct.entities);
            console.log('cleanUp. entityIndexMap:',this.struct.entityIndexMap);

            //Remove hooks and physics body
            this.onTargetReached = undefined;//clear hook bindings to prevent ref to the entity from existing which will prevent garbage collection
            this.updateInternalState = undefined;
            if (this.characterRigidBody) {
                physicsWorld.removeRigidBody(this.characterRigidBody);//remove its rigid body from the physics world
                this.characterRigidBody = null;//this is a critical step for it to work.nullify the ref to the rigid body after removal.
            }
            this.isRemoved = true;
            this.cleanupTimer = 0;//you actually dont need to reset this since the entity will no longer exist to use it again.so there is no need to woryy about an invalid state.but its good practice to still do this
        }
    }
    get cleanUp():() => void {
        return this.cleanUpResources;
    }
    get _state():EntityStateMachine {
        return this.state
    }
    get _health():Health {
        return this.health;
    }
    get _targetEntity():EntityLike | null {
        return this.targetEntity;
    }
    get _navPosition(): THREE.Vector3 | null {
        return this.navPosition;
    }
    get _struct():ManagingStructure {
        return this.struct
    }
    get _groupID():string | null {
        return this.groupID;
    }
    set _groupID(groupID:string | null ) {
        this.groupID = groupID;
    }
    
    set _navPosition(newPosition:THREE.Vector3 | null) {
        this.navPosition = newPosition
    }
    set _movementType(moveType:'fluid' | 'precise') {
        this.movementType = moveType
    }
    set _targetEntity(targetEntity:EntityLike | null) {
        this.targetEntity = targetEntity
    }
    protected onLoop(): void {
        this.patrolTimer += this.clockDelta || 0;
        this.currentHealth = this.health.value;
        this.useItemTimer += this.clockDelta || 0;
        this.checkIfOutOfBounds();
        this.health.checkGroundDamage(this.velBeforeHittingGround);
        if (this.updateInternalState) this.updateInternalState(); 
        this.reactToStateMachine();
    }
}
//i intened to define these variables as public variables of the entity manager but because of their wide use in the codebase,it was impossible to do that without causing circular imports where the manager imports a variable that also depends on this variable
export const entities:EntityContract[] = [];
export const entityIndexMap:Map<Entity,number> = new Map();