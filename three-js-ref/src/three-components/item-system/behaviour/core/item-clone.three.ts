import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d"
import { physicsWorld } from "../../../physics-world.three";
import { disposeHierarchy } from "../../../disposer/disposer.three";
import type { ItemCloneData } from "./types";
import { getGroundDetectionDistance } from "../../../controller/helper";

function createBoxLine(width:number,height:number,depth:number) {
    const charGeometry = new THREE.BoxGeometry(width,height,depth);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}
export class ItemClone {
    public  mesh:THREE.Group = new THREE.Group();
    public  rigidBody:RAPIER.RigidBody | null;
    private handle:number;
    private height:number;
    private parent:THREE.Group

    private spinApplied = false;
    private static readonly addHitbox:boolean = true;

    constructor(parent:THREE.Group,clonedModel: THREE.Group,spawnPosition:THREE.Vector3,data:ItemCloneData) {
        this.parent = parent;
        this.height = data.height;
        const box = new THREE.Box3().setFromObject(clonedModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        const scaleX = data.width / size.x;
        const scaleY = data.height / size.y;
        const scaleZ = data.depth / size.z;

        clonedModel.scale.set(scaleX, scaleY, scaleZ);
        clonedModel.position.y -= data.height / 2;

        this.mesh.add(clonedModel)
        this.mesh.position.copy(spawnPosition);

        const hitbox = createBoxLine(data.width,data.height,data.depth);//this is for debugging
        if (ItemClone.addHitbox) this.mesh.add(hitbox);

        const cloneCollider = RAPIER.ColliderDesc.cuboid(data.width/2,data.height/2,data.depth/2).setDensity(data.density);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic()
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        this.handle = physicsWorld.createCollider(cloneCollider,this.rigidBody).handle;

        this.rigidBody.setTranslation(spawnPosition,true);
        this.mesh.position.copy(this.rigidBody.translation());
    }
    private applySpin() {
        if (this.rigidBody && !this.spinApplied) {
            const baseSpinVelocity = 100;
            const spinMagnitude = baseSpinVelocity / this.rigidBody.mass();//we are making this inversely proportional because the point here isnt to make all objects of all masses to spin like a ball but to make objects that can spin to spin while heavier ones shouldnt

            const spinVelocity = new RAPIER.Vector3(
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude
            );
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
    public updateClone() {
        if (this.rigidBody) {
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
        }
    }
    public cleanUp() {
        this.parent.remove(this.mesh)
        disposeHierarchy(this.mesh)
        if (this.rigidBody) {
            physicsWorld.removeRigidBody(this.rigidBody)
            this.rigidBody = null
        }
    }
}