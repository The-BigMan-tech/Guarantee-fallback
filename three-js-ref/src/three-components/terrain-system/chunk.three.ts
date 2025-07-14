import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { physicsWorld } from "../physics-world.three";
import { disposeHierarchy } from "../disposer/disposer.three";

export interface ContentData {
    content?:THREE.Group,
    cleanUpPhysics?:()=> void
}
export interface ChunkData {
    cords:THREE.Vector3
    volume:THREE.Vector3,
    parent:THREE.Group
}
export class Chunk {
    private chunkBody:THREE.Group | null;
    private chunkRigidBody:RAPIER.RigidBody | null;
    private chunkContent:ContentData | null;
    private parent:THREE.Group;//this will be the group of floors held by the terrain manager

    constructor(chunkData:ChunkData,chunkContent:ContentData | null) {
        this.chunkContent = chunkContent;
        this.chunkBody = new THREE.Group();
        this.parent = chunkData.parent;
        this.parent.add(this.chunkBody);
        const {cords,volume} = chunkData;
        
        const chunkHeight = volume.y;
        const chunkGeometry = new THREE.BoxGeometry(volume.x,chunkHeight,volume.z);
        const chunkMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
        const chunkMesh = new THREE.Mesh(chunkGeometry,chunkMaterial);
        this.chunkBody.add(chunkMesh);
        chunkMesh.receiveShadow = true;
        
        const chunkCollider = RAPIER.ColliderDesc.cuboid(volume.x/2,chunkHeight/2,volume.z/2);
        this.chunkRigidBody = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        physicsWorld.createCollider(chunkCollider,this.chunkRigidBody);

        const chunkPosY = cords.y + chunkHeight/2;//to fix the situation where half of it is above and half is below the specfied ground level
        this.chunkRigidBody.setTranslation({x:cords.x,y:chunkPosY,z:cords.z},true);
        this.chunkBody.position.copy(this.chunkRigidBody.translation());
        if (chunkContent?.content) this.chunkBody.add(chunkContent.content);
    }    
    public cleanUp():void {
        if (this.chunkRigidBody) {
            physicsWorld.removeRigidBody(this.chunkRigidBody);
            this.chunkRigidBody = null;
        }
        if (this.chunkContent?.cleanUpPhysics) {//this has to be done before clearing the hieararchy of the floor model
            this.chunkContent.cleanUpPhysics();
        }
        if (this.chunkBody) {
            disposeHierarchy(this.chunkBody);
            if (this.parent) {
                this.parent.remove(this.chunkBody);
            }
            this.chunkBody = null;
        }
    }
}