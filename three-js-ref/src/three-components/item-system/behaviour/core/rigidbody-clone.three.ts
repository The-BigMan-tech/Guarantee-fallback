import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d"
import { outOfBoundsY, physicsWorld } from "../../../physics-world.three";
import { disposeHierarchy } from "../../../disposer/disposer.three";
import type { CloneArgs } from "./types";
import { getGroundDetectionDistance, VelCalcUtils } from "../../../controller/helper";
import { Health } from "../../../health/health";
import { createBoxLine, rotateBy180 } from "../other-helpers.three";
import { RigidBodyClones } from "./rigidbody-clones.three";
import { player } from "../../../player/player.three";
import { IntersectionRequest } from "../../../player/intersection-request.three";

//Note:The Controller and RigidBodyClone class are what ill be using and i recoomend to use to create dynamic physics bodies because they have a simple api while providing management underneath.The controler is for dynamic bodies that are controlled by a living entity while rigid body clone are for game objects 
export class RigidBodyClone {
    public  mesh:THREE.Group = new THREE.Group();
    public  rigidBody:RAPIER.RigidBody | null;
    private handle:number;
    private height:number;

    private spinApplied = false;
    private spinVectorInAir:THREE.Vector3;//this is a unit vector used to determine which component the spin velocity is applied.each component is like a flag to decide whether to apply spin in this axis or not
    private static readonly addHitbox:boolean = false;
    
    public durability:Health;//i reused the health class for durability because its literally the same functionality.so im leveraging code reuse but i renamed it to durability for clarity that it isnt a living entity

    private velCalcUtils:VelCalcUtils = new VelCalcUtils();

    private parent:THREE.Group;
    private despawnRadius:number = 500;

    private intersectionRequest = new IntersectionRequest();

    public static createClone(args:CloneArgs):RigidBodyClone {//i made a separate method for creating an item clone without the constructor because a behaviour may or may not even need the clone instance at all.the item clone class will already add the clone to the scene and update it at every loop.so there is isnt any management the behaviour class has to do with the clone after creating it.they can just use the exposed method to perform actions on the clone like applying knockback
        return new RigidBodyClone(args)
    }
    private constructor(args:CloneArgs) {
        const {model,spawnPosition,spawnQuaternion,properties,spinVectorInAir,parent} = args;
        this.parent = parent;

        this.height = properties.height;
        this.spinVectorInAir = spinVectorInAir.normalize();//i normalized it to ensure its a unit vector
        const clonedModel = model.clone(true);
        const box = new THREE.Box3().setFromObject(clonedModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        const scaleX = properties.width / size.x;
        const scaleY = properties.height / size.y;
        const scaleZ = properties.depth / size.z;

        clonedModel.scale.set(scaleX, scaleY, scaleZ);
        clonedModel.position.y -= properties.height / 2;

        this.mesh.add(clonedModel);
        this.mesh.position.copy(spawnPosition);

        const hitbox = createBoxLine(properties.width,properties.height,properties.depth);//this is for debugging
        if (RigidBodyClone.addHitbox) this.mesh.add(hitbox);

        const cloneCollider = RAPIER.ColliderDesc.cuboid(properties.width/2,properties.height/2,properties.depth/2).setDensity(properties.density);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic()
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        this.handle = physicsWorld.createCollider(cloneCollider,this.rigidBody).handle;

        this.rigidBody.setTranslation(spawnPosition,true);
        this.rigidBody.setRotation(spawnQuaternion.clone().multiply(rotateBy180()),true);//i rotated it by 180 so that it faces the player on spawn because directly making the clone rotation the player's quaternion will make it face where the player is facing not at the player.

        this.mesh.position.copy(this.rigidBody.translation());
        this.mesh.quaternion.copy(this.rigidBody.rotation());

        this.durability = new Health(properties.durability);

        RigidBodyClones.clones.push(this);//automatically push the clone to the clones array for updating
        RigidBodyClones.cloneIndices.set(this,RigidBodyClones.clones.length-1);//add its index to the map for removal
        this.parent.add(this.mesh)//add it to the parent group to be shown in the scene
    }


    private applySpin() {
        if (this.rigidBody && !this.spinApplied) {
            const baseSpinVelocity = 100;
            const spinMagnitude = baseSpinVelocity / this.rigidBody.mass();//we are making this inversely proportional because the point here isnt to make all objects of all masses to spin like a ball but to make objects that can spin to spin while heavier ones shouldnt

            const spinVelocity = new THREE.Vector3(
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude
            ).multiply(this.spinVectorInAir);

            this.rigidBody.setAngvel(spinVelocity, true);//i directly set the ang vel here over applying torque because doing so wont produce the desired effects because rapier also does its own calc before applying it
            this.spinApplied = true;//to prevent applying a spin to the body when one is already applied.we reset it here to ensure that its only set to true when its guaranteed that this method applied the torque
            console.log('spin applied');
        }
    }


    private isGrounded():boolean {
        if (this.rigidBody?.isSleeping()) return true;//if it sleeps,its grounded.so we can skip the computation here.
        const groundDetectionDistance = getGroundDetectionDistance(this.height)
        const groundPoint = (this.mesh.position.y - groundDetectionDistance) + ((this.height%2)*0.5);//took into account the parity of the height
        const groundPos = this.mesh.position.clone().setY(groundPoint);
        console.log('spin. groundPoint:', groundPoint);

        let onGround = false
        physicsWorld.intersectionsWithPoint(groundPos, (colliderObject) => {
            if (this.handle==colliderObject.handle) return true//avoid clone's own collider
            onGround = true;
            return false;
        })
        return onGround
    }


    public applyKnockback(sourcePosition:THREE.Vector3,strength:number) {
        const direction = new THREE.Vector3().subVectors(this.rigidBody!.translation(), sourcePosition).normalize();
        const impulse = direction.multiplyScalar(strength)
        this.rigidBody!.applyImpulse(impulse, true);
    }

    private applyGroundDamage(onGround:boolean) {
        const velocityY = this.rigidBody!.linvel().y;
        const velBeforeHittingGround = this.velCalcUtils.getVelJustAboveGround(velocityY,onGround)
        this.durability.checkGroundDamage(velBeforeHittingGround);
    }
    private isOutOfBounds():boolean {
        if (this.rigidBody!.translation().y <= outOfBoundsY) {
            return true
        }
        return false;
    }
    private checkIfOutOfBounds() {
        if (this.isOutOfBounds()) {
            this.durability.takeDamage(this.durability.value);
        }
    }
    private despawnSelfIfFar() {
        const distance = player.position.distanceTo(this.mesh.position);
        if (distance > this.despawnRadius) {
            this.cleanUp()
        }
    }
    private raycaster:THREE.Raycaster = new THREE.Raycaster();
    private knockbackObjectsAlongPath() {
        const velDirection = this.velCalcUtils.getRigidBodyDirection(this.rigidBody!);
        if (!velDirection.equals(new THREE.Vector3(0,0,0))) {
            console.log('impact. direction: ',velDirection);
            const origin = new THREE.Vector3().copy(this.rigidBody!.translation()); // Get the position of the rigid body
            this.raycaster.set(origin,velDirection);
        }
    }
    private isRemoved = false;
    public updateClone() {
        this.despawnSelfIfFar();//the reason why i made each clone responsible for despawning itself unlike the entity system where the manager despawns far entities is because i dont want to import the player directly into the class that updates the clones because the player also imports that.so its to remove circular imports
        if (this.rigidBody && !this.durability.isDead) {
            this.checkIfOutOfBounds();
            this.mesh.position.copy(this.rigidBody.translation());
            this.mesh.quaternion.copy(this.rigidBody.rotation());
            const onGround = this.isGrounded();

            console.log('spin. is Body sleeping: ',this.rigidBody.isSleeping());
            console.log('spin. is Body grounded: ',onGround);

            if (!onGround) {
                this.applySpin();
            }else {
                this.spinApplied = false; //its on the ground so we need to reset it so that spin can apply again after next throw
            }
            this.knockbackObjectsAlongPath();
            this.applyGroundDamage(onGround);  
        }else if (!this.isRemoved) {//to ensure resources are cleaned only once 
            this.cleanUp();
        }
    }


    private removeFromClones() {//used swap and pop delete for O(1) deletion
        const index = RigidBodyClones.cloneIndices.get(this)!;
        const lastIndex = RigidBodyClones.clones.length - 1;
        if (index < lastIndex) {
            const lastClone = RigidBodyClones.clones[lastIndex];
            RigidBodyClones.clones[index] = lastClone;
            RigidBodyClones.cloneIndices.set(lastClone,index)
        }
        RigidBodyClones.clones.pop();
        RigidBodyClones.cloneIndices.delete(this);
    }


    public cleanUp() {
        this.parent.remove(this.mesh)
        disposeHierarchy(this.mesh);
        this.removeFromClones();
        if (this.rigidBody) {
            physicsWorld.removeRigidBody(this.rigidBody)
            this.rigidBody = null
        }
        this.isRemoved = true;
        console.log('targetDurability. cleaned up block');
    }
    public interact?:()=>void//a hook i will integrate with the clone for custom interactions after spawning the clone per behaviour.for example,an explosive behaviour doesnt make an item an explosive.it only spawns a rigid body clone.so what it can do is to modify the hook of this clone to cause an explosion making this clone an explosive without the clone being inherited or derived from the explosive behaviour itself.it will remain as a clone
}
