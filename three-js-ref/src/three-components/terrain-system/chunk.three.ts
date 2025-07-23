import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { physicsWorld } from "../physics-world.three";
import { disposeHierarchy } from "../disposer/disposer.three";
import { FloorContent } from "./floor-content.three";

export interface ChunkData {
    chunkPos:THREE.Vector3
    chunkSize:number,
    chunkParent:THREE.Group
}
export class Chunk {
    private group:THREE.Group | null;
    private chunkRigidBody:RAPIER.RigidBody | null;
    private distributions:FloorContent | null;
    private chunkParent:THREE.Group;//this will be the group of floors held by the terrain manager

    constructor(chunkData:ChunkData,distributions:FloorContent | null) {
        this.group = new THREE.Group();
        this.chunkParent = chunkData.chunkParent;
        this.chunkParent.add(this.group);
        const {chunkPos,chunkSize} = chunkData;

        const chunkHeight = 1
        const chunkGeometry = new THREE.BoxGeometry(chunkSize,chunkHeight,chunkSize);
        const chunkMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
        const chunkMesh = new THREE.Mesh(chunkGeometry,chunkMaterial);
        this.group.add(chunkMesh);
        chunkMesh.receiveShadow = true;
        
        const chunkCollider = RAPIER.ColliderDesc.cuboid(chunkSize/2,chunkHeight/2,chunkSize/2);
        const chunkBody = RAPIER.RigidBodyDesc.fixed();
        this.chunkRigidBody = physicsWorld.createRigidBody(chunkBody);
        physicsWorld.createCollider(chunkCollider,this.chunkRigidBody);
        
        
        const cellSize = 20;     // desired size of each cell
        let gridDivisions = Math.floor(chunkSize / cellSize);
        if (gridDivisions % 2 !== 0) gridDivisions += 1;
        const gridHelper = new THREE.GridHelper(chunkSize,gridDivisions,0x000000,0x000000);
        gridHelper.position.y +=  chunkHeight / 2 + 0.01;// slightly above floor surface
        this.group.add(gridHelper)


        const chunkPosY = chunkHeight/2 + chunkPos.y;//to fix the situation where half of it is above and half is below the specfied ground level
        this.chunkRigidBody.setTranslation({x:chunkPos.x,y:chunkPosY,z:chunkPos.z},true);
        this.group.position.copy(this.chunkRigidBody.translation());

        this.distributions = distributions;
        if (this.distributions) {
            this.distributions.generateDistributions();
            this.group.attach(this.distributions.content);//i used attatch here instaed of add so that i can use world space cords to create clones for distribution safely because my item clone class expects that the parent group is at world cords and if i used add here,the cords of the group will shift which will cause bugs
        }
    }    
    public cleanUp():void {
        if (this.chunkRigidBody) {
            physicsWorld.removeRigidBody(this.chunkRigidBody);
            this.chunkRigidBody = null;
        }
        if (this.distributions) {//this has to be done before clearing the hieararchy of the floor model
            this.distributions.cleanUpClones();
        }
        if (this.group) {
            disposeHierarchy(this.group);
            this.chunkParent.remove(this.group);
            this.group = null;
        }
    }
}