import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as THREE from "three"
import { Health } from "../health/health";
import { combatCooldown, physicsWorld } from "../physics-world.three";

type Behaviour = 'idle' | 'patrol' | 'chase' | 'attack' | 'death';

export interface EntityMiscData {
    healthValue:number,
    targetController:Controller | null,
    targetHealth:Health | null,
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
}
export class Entity extends Controller {
    private targetController:Controller | null = null;
    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    public health:Health;
    private targetHealth:Health | null = null;

    private attackDamage:number;

    private attackCooldown = combatCooldown; // cooldown duration in seconds
    private attackTimer = 0;    // timer accumulator

    private patrolRadius = 20; // max distance from current position to patrol
    private patrolCooldown = 3; // seconds between patrol target changes
    private patrolTimer = 0;

    private cleanupTimer = 0;
    private cleanupCooldown = 7;//to allow playing an animation before removal
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
        this.targetController = miscData.targetController
        this.targetHealth = miscData.targetHealth;
        this.attackDamage = miscData.attackDamage;
        this.struct = struct;
        this.knockback = miscData.knockback;
    }
    private getRandomPatrolPoint(): THREE.Vector3 {
        const currentPos = this.position.clone();
        const randomPoint = (Math.random() - 0.5) * 2 * this.patrolRadius
        const randomOffset = new THREE.Vector3(randomPoint,0,randomPoint);
        return currentPos.add(randomOffset);
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
        if (!this.targetHealth) return;
        if (this.attackTimer > (this.attackCooldown -0.4)) {//this is to ensure that the animation plays a few milli seconds before the knockback is applied to make it more natural
            this.playAttackAnimation();
        }
        if (this.attackTimer > this.attackCooldown) {
            this.targetController?.knockbackCharacter('backwards',this.knockback);
            this.targetHealth.takeDamage(this.attackDamage);
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
    private disposeMixer():void {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
            this.mixer = null; // Remove reference for GC
        }
    }
    private disposeHierarchy(object: THREE.Object3D):void {
        object.traverse((child) => {
            if ((child as THREE.Mesh).geometry) {//clean its geometry
                (child as THREE.Mesh).geometry.dispose();
            }
            if ((child as THREE.Mesh).material) {//clean its textures
                const material = (child as THREE.Mesh).material;
                if (Array.isArray(material)) {
                    material.forEach(mat => mat.dispose());
                } else {
                    material.dispose();
                }
            }
        });
    }
    private cleanUpResources():void {
        this.cleanupTimer += this.clockDelta || 0;
        if (this.cleanupTimer >= this.cleanupCooldown) {//the cooldown is here to allow playing of death animations or ending effects
            this.points.clear();//clear the points array used for visual debugging
            this.struct.group.remove(this.points)//remove them from the scene
            this.struct.group.remove(this.char);//remove the controller from the scene
            this.disposeHierarchy(this.char);//remove the geometry data from the gpu
            this.disposeMixer();//to prevent animation updates
            const index = this.struct.entities.findIndex(entityWrapper => entityWrapper._entity === this);
            if (index !== -1) this.struct.entities.splice(index, 1);//remove it from the entity array to prevent its physics controller from updating,stop the player from possibly intersecting with it although unlikely since its removed from the scene and finally for garbae collection
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
    get _targetHealth():Health | null {
        return this.targetHealth;
    }
    get _state():EntityStateMachine {
        return this.state
    }
    get _health():Health {
        return this.health;
    }
    get _targetController():Controller | null {
        return this.targetController;
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
    set _targetHealth(health:Health | null) {
        this.targetHealth = health
    }
    set _targetController(controller:Controller | null) {
        this.targetController = controller
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
