import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d"
import { physicsWorld } from "../../../physics-world.three";
import { disposeHierarchy } from "../../../disposer/disposer.three";
import type { ItemCloneProps } from "./types";
import { getGroundDetectionDistance } from "../../../controller/helper";
import { Health } from "../../../health/health";

function createBoxLine(width:number,height:number,depth:number) {
    const charGeometry = new THREE.BoxGeometry(width,height,depth);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}

interface CloneArgs {
    model: THREE.Group,
    spawnPosition:THREE.Vector3,
    properties:ItemCloneProps,
    spinVectorInAir:THREE.Vector3,
}
export class ItemClone {
    public  mesh:THREE.Group = new THREE.Group();
    public  rigidBody:RAPIER.RigidBody | null;
    private handle:number;
    private height:number;

    private spinApplied = false;
    private spinVectorInAir:THREE.Vector3;//this is a unit vector used to determine which component the spin velocity is applied.each component is like a flag to decide whether to apply spin in this axis or not
    private static readonly addHitbox:boolean = false;
    
    public durability:Health;

    public static createClone(args:CloneArgs):ItemClone {//i made a separate method for creating an item clone without the constructor because a behaviour may or may not even need the clone instance at all.the item clone class will already add the clone to the scene and update it at every loop.so there is isnt any management the behaviour class has to do with the clone after creating it.they can just use the exposed method to perform actions on the clone like applying knockback
        return new ItemClone(args)
    }
    private constructor(args:CloneArgs) {
        const {model,spawnPosition,properties,spinVectorInAir} = args;
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

        this.mesh.add(clonedModel)
        this.mesh.position.copy(spawnPosition);

        const hitbox = createBoxLine(properties.width,properties.height,properties.depth);//this is for debugging
        if (ItemClone.addHitbox) this.mesh.add(hitbox);

        const cloneCollider = RAPIER.ColliderDesc.cuboid(properties.width/2,properties.height/2,properties.depth/2).setDensity(properties.density);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic()
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        this.handle = physicsWorld.createCollider(cloneCollider,this.rigidBody).handle;

        this.rigidBody.setTranslation(spawnPosition,true);
        this.mesh.position.copy(this.rigidBody.translation());

        this.durability = new Health(properties.durability);

        ItemClones.clones.push(this);//automatically push the clone to the clones array for updating
        ItemClones.cloneIndices.set(this,ItemClones.clones.length-1);//add its index to the map for removal
        ItemClones.group.add(this.mesh);//auto add it to the group to be shown in the scene
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

    private isRemoved = false;
    public updateClone() {
        if (this.rigidBody && !this.durability.isDead) {
            this.mesh.position.copy(this.rigidBody.translation());
            this.mesh.quaternion.copy(this.rigidBody.rotation());
            console.log('spin. is Body sleeping: ',this.rigidBody.isSleeping());
            const onGround = this.isGrounded();
            console.log('spin. is Body grounded: ',onGround);
            if (!onGround) {
                this.applySpin();
            }else {
                this.spinApplied = false; //its on the ground so we need to reset it so that spin can apply again after next throw
            }
        }else if (!this.isRemoved) {//to ensure resources are cleaned only once 
            console.log('targetDurability. cleaned up block');
            this.cleanUp();
        }
    }
    
    private removeFromClones() {//used swap and pop delete for O(1) deletion
        const index = ItemClones.cloneIndices.get(this)!;
        const lastIndex = ItemClones.clones.length - 1;
        if (index < lastIndex) {
            const lastClone = ItemClones.clones[lastIndex];
            ItemClones.clones[index] = lastClone;
            ItemClones.cloneIndices.set(lastClone,index)
        }
        ItemClones.clones.pop();
        ItemClones.cloneIndices.delete(this);
    }
    public cleanUp() {
        ItemClones.group.remove(this.mesh)
        disposeHierarchy(this.mesh);
        this.removeFromClones();
        if (this.rigidBody) {
            physicsWorld.removeRigidBody(this.rigidBody)
            this.rigidBody = null
        }
        this.isRemoved = true
    }
    
}
export class ItemClones {
    public static clones:ItemClone[] = [];//this is for the player to get the looked at clone and dispose its reources when removing it
    public static cloneIndices:Map<ItemClone,number> = new Map();
    public static group:THREE.Group = new THREE.Group();

    public static updateClones() {
        for (const clone of ItemClones.clones) {
            clone.updateClone()
        }
    }
}