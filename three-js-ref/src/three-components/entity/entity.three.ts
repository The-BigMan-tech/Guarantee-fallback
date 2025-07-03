import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as THREE from "three"
import { Health } from "../health/health";
import { physicsWorld } from "../physics-world.three";

type Behaviour = 'chasing' | 'attack' | 'patrol'
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
export interface ManagingStructure {
    group:THREE.Group,
    entities:Entity[]
}
export class Entity extends Controller {
    private targetController:Controller | null = null;
    private navPosition:THREE.Vector3 | null = null;//strictly for position in case where the entity might not have a target ref but it still wants to go navigate somewhere

    public health:Health;
    private targetHealth:Health | null = null;

    private attackDamage:number;

    private attackCooldown = 1; // cooldown duration in seconds
    private attackTimer = 0;    // timer accumulator

    private patrolRadius = 20; // max distance from current position to patrol
    private patrolTarget: THREE.Vector3 | null = null;
    private patrolCooldown = 3; // seconds between patrol target changes
    private patrolTimer = 0;

    private cleanupTimer = 0;
    private cleanupCooldown = 7;//to allow playing an animation before removal

    private struct:ManagingStructure;
    private knockback:number;

    private movementType:'fluid' | 'precise' = 'precise'

    private state:EntityStateMachine = {
        behaviour:'patrol'
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
    private patrol() {
        if (this.patrolTimer >= this.patrolCooldown) {
            this.patrolTarget = this.getRandomPatrolPoint();
            this.navPosition = this.patrolTarget;
            this.patrolTimer = 0;
        }
        this.movementType = "fluid";
        this.state.behaviour = 'chasing';
        this.respondToInternalState();
    }  
    private chase() {
        if (this.navPosition) {
            const rotateAndMove = (this.movementType == "precise") ? false : true;
            const atTarget = this.navToTarget(this.navPosition,rotateAndMove);
            if (atTarget) {
                this.onTargetReached();
                this.respondToInternalState();//any state change from the above hook will be caught and responded to in the same frame
            }
        }
    }
    private attack() {
        if (!this.targetHealth) return;
        if (this.attackTimer >= this.attackCooldown) {
            this.targetHealth.takeDamage(this.attackDamage);
            // this.targetController?.knockbackCharacter(this.position,this.knockback)
            this.attackTimer = 0;
        }
    }

    private respondToInternalState() {
        switch (this.state.behaviour) {
            case 'patrol': {
                this.patrol();
                break;
            }
            case 'chasing': {
                this.chase();
                break;
            }
            case 'attack': {
                this.attack();
                break;
            }
        }
    }
    private respondToExternalState() {//this method respond to external state and it can optionally transition the internal state for a response
        console.log("Health. Entity: ",this.health.value);
        if (!this.targetController || !this.targetHealth) return;
        if (this.targetHealth.isDead) {
            this.state.behaviour = "patrol";
        }
        if (!this.targetHealth.isDead) {//we want to continuously chase the target constantly every frame its not dead because navToTArget as used in chase doesnt remember the target position by design choice.you have to pass it to it every frame to progress it towards that target.
            this.navPosition = this.targetController.position;
            this.movementType = "precise"
            this.state.behaviour = "chasing"
        }
    }
    public disposeMixer() {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
            this.mixer = null; // Remove reference for GC
        }
    }
    private disposeHierarchy(object: THREE.Object3D) {
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
    private isRemoved = false;//to ensure resources are cleaned only once per dead entity
    public handleRemoval() {
        if (this.health.isDead && !this.isRemoved) {
            this.cleanupTimer += this.clockDelta || 0;
            //play death animation here.
            if (this.cleanupTimer >= this.cleanupCooldown) {
                this.points.clear();//clear the points array used for visual debugging
                this.struct.group.remove(this.points)//remove them from the scene
                this.struct.group.remove(this.controller);//remove the controller from the scene
                console.log("Rigid body: ",this.characterRigidBody);
                this.disposeHierarchy(this.controller);//remove the geometry data from the gpu
                this.disposeMixer();//to prevent animation updates
                const index = this.struct.entities.indexOf(this);
                if (index !== -1) this.struct.entities.splice(index, 1);//remove it from the entity array to prevent its physics controller from updating,stop the player from possibly intersecting with it although unlikely since its removed from the scene and finally for garbae collection
                if (this.characterRigidBody) {
                    physicsWorld.removeRigidBody(this.characterRigidBody);//remove its rigid body from the physics world
                    this.characterRigidBody = null;//this is a critical step for it to work.nullify the ref to the rigid body after removal.
                }
                this.isRemoved = true;
            }
        }
    }
    private onTargetReached() {//the behaviour when it reaches the target will be later tied to a state machine
        console.log("Agent has reached target");
        this.state.behaviour = 'attack'
    }
    protected onLoop(): void {
        this.attackTimer += this.clockDelta || 0;
        this.patrolTimer += this.clockDelta || 0;
        this.respondToExternalState();
        this.respondToInternalState();
        this.handleRemoval();
    }
}
export const entities:Entity[] = [];

