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
    private width:number;
    private parent:THREE.Group

    private static readonly addHitbox:boolean = false;

    constructor(parent:THREE.Group,clonedModel: THREE.Group,spawnPosition:THREE.Vector3,data:ItemCloneData) {
        this.parent = parent;
        this.height = data.height;
        this.width = data.width;
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

        const cloneCollider = RAPIER.ColliderDesc.cuboid(data.width/2,data.height/2,data.depth/2);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic();
        cloneBody.mass = data.mass;
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        this.handle = physicsWorld.createCollider(cloneCollider,this.rigidBody).handle;

        this.rigidBody.setTranslation(spawnPosition,true);

        const spinVelocity = 5; // max magnitude for spin
        const symmetricalSpinVelocity = 2 * spinVelocity
        const angularVelocity = new RAPIER.Vector3(
          (Math.random() - 0.5) * symmetricalSpinVelocity,
          (Math.random() - 0.5) * symmetricalSpinVelocity,
          (Math.random() - 0.5) * symmetricalSpinVelocity
        );
        this.rigidBody.applyTorqueImpulse(angularVelocity, true);//this is to rotate it when it spawns for realisic falling if spawned in mid air--good for throwable blocks
        this.mesh.position.copy(this.rigidBody.translation());
    }
    private isGrounded():boolean {
        const groundDetectionDistance = getGroundDetectionDistance(this.height)
        const groundPoint = this.mesh.position.y - groundDetectionDistance;
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
            console.log('is Body sleeping: ',this.rigidBody.isSleeping());
            console.log('spin. is Body grounded: ',this.isGrounded());
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