import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as THREE from "three"
import { Health } from "../health/health";
import { combatCooldown, physicsWorld } from "../physics-world.three";
import type { EntityLike } from "./relationships.three";
import { disposeHierarchy, disposeMixer } from "../disposer/disposer.three";

type Behaviour = 'idle' | 'patrol' | 'chase' | 'attack' | 'death';

export interface EntityMiscData {
    targetEntity:EntityLike | null,
    healthValue:number,
    attackDamage:number,
    knockback:number
}
interface EntityStateMachine {
    behaviour:Behaviour
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

interface CountData {
    currentCount:number,
    minCount:number
}
export interface EntityCount {
    totalCount:number,
    individualCounts:Record<EntityWrapper,CountData>
}
export type EntityWrapper = 'Enemy' | 'NPC'

export interface FullEntityData {
    fixedData:FixedControllerData,
    dynamicData:DynamicControllerData,
    miscData:EntityMiscData
    managingStruct:ManagingStructure
}


export class Entity extends Controller {
    private targetEntity:EntityLike | null = null;

    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    public health:Health;
    private attackDamage:number;

    private readonly attackCooldown = combatCooldown; // cooldown duration in seconds
    private attackTimer = 0;    // timer accumulator

    private readonly patrolRadius = 15; // max distance from current position to patrol
    private readonly patrolCooldown = 7; // seconds between patrol target changes
    private patrolTimer = 0;
    public basePatrolPoint:THREE.Vector3 | null = null;//this is meant to be hook where a concrete entity changes where the patrolling is centred around by changing this value.by default its null.so if null,it uses the characterPos as the patrol point else,it uses the provided one.

    private cleanupTimer = 0;
    private readonly cleanupCooldown = 7;//to allow playing an animation before removal
    private isRemoved = false;//to ensure resources are cleaned only once per dead entity

    private struct:ManagingStructure;
    private knockback:number;

    private fadeDuration = 2; // seconds
    private elapsed = 0;

    private movementType:'fluid' | 'precise' = 'precise'


    private state:EntityStateMachine = {
        behaviour:'idle'
    }

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,miscData:EntityMiscData,struct:ManagingStructure) {
        super(fixedData,dynamicData);
        this.health = new Health(miscData.healthValue);
        this.targetEntity = miscData.targetEntity
        this.attackDamage = miscData.attackDamage;
        this.struct = struct;
        this.knockback = miscData.knockback;
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
        this.playIdleAnimation()
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
        this.attackTimer += this.clockDelta || 0;
        if (!this.targetEntity?.health) return;
        if (this.attackTimer > (this.attackCooldown -0.4)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.playAttackAnimation();
        }
        if (this.attackTimer > this.attackCooldown) {
            this.targetEntity.knockbackCharacter('backwards',this.knockback);
            this.targetEntity.health.takeDamage(this.attackDamage);
            this.attackTimer = 0;
        }
        else this.idle();
    }
    public death():void {
        if (this.health.isDead && !this.isRemoved) {
            this.playDeathAnimation();
            this.fadeOut(this.clockDelta || 0);
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
    private fadeOut(deltaTime:number):void {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.fadeDuration, 1);
        const opacity = 1 - progress;
    
        this.char.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh && mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((mat) => {
                        mat.transparent = true;
                        mat.opacity = opacity;
                        mat.depthWrite = false; // helps with rendering transparent objects
                    });
                } else {
                    mesh.material.transparent = true;
                    mesh.material.opacity = opacity;
                    mesh.material.depthWrite = false;
                }
            }
        });
    }
    private isEntityWrapper(name: string): name is EntityWrapper {
        return name === 'Enemy' || name === 'NPC';
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
    private cleanUpResources():void {
        this.cleanupTimer += this.clockDelta || 0;
        if (this.cleanupTimer >= this.cleanupCooldown) {//the cooldown is here to allow playing of death animations or ending effects
            this.points.clear();//clear the points array used for visual debugging
            this.struct.group.remove(this.points)//remove them from the scene
            this.struct.group.remove(this.char);//remove the controller from the scene
            disposeHierarchy(this.char);//remove the geometry data from the gpu
            this.mixer = disposeMixer(this.mixer);//to prevent animation updates
            const index = this.struct.entityIndexMap.get(this)!;
            
            const entityWrapper:EntityContract = this.struct.entities[index];
            const wrapperName:string = entityWrapper.constructor.name
            if (this.isEntityWrapper(wrapperName)) {//this operation must be done before deletion of the entry
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

            this.onTargetReached = undefined;//clear hook bindings to prevent ref to the entity from existing which will prevent garbage collection
            this.updateInternalState = undefined;
            if (this.characterRigidBody) {
                physicsWorld.removeRigidBody(this.characterRigidBody);//remove its rigid body from the physics world
                this.characterRigidBody = null;//this is a critical step for it to work.nullify the ref to the rigid body after removal.
            }
            this.isRemoved = true;
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
        this.health.checkGroundDamage(this.velBeforeHittingGround);
        if (this.isAirBorne() && (!this.health.isDead)) this.playJumpAnimation();
        if (this.updateInternalState) this.updateInternalState(); 
        this.reactToStateMachine();
    }
}
export const entities:EntityContract[] = [];
export const entityIndexMap:Map<Entity,number> = new Map();