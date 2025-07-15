import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { physicsWorld } from "../physics-world.three";
import { disposeHierarchy } from "../disposer/disposer.three";
import { FloorContent } from "./floor-content.three";

export interface FloorData {
    chunkPos:THREE.Vector3
    chunkSize:number,
    parent:THREE.Group
}
export class Floor {
    private floorModel:THREE.Group | null;
    private floorRigidBody:RAPIER.RigidBody | null;
    private floorContent:FloorContent | null;
    private parent:THREE.Group;//this will be the group of floors held by the terrain manager

    constructor(floorData:FloorData,floorContent:FloorContent | null) {
        this.floorContent = floorContent;
        this.floorModel = new THREE.Group();
        this.parent = floorData.parent;
        this.parent.add(this.floorModel);
        const {chunkPos,chunkSize} = floorData;

        const floorHeight = 1
        const floorGeometry = new THREE.BoxGeometry(chunkSize,floorHeight,chunkSize);
        const floorMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
        const floorMesh = new THREE.Mesh(floorGeometry,floorMaterial);
        this.floorModel.add(floorMesh);
        floorMesh.receiveShadow = true;
        
        const floorCollider = RAPIER.ColliderDesc.cuboid(chunkSize/2,floorHeight/2,chunkSize/2);
        const floorBody = RAPIER.RigidBodyDesc.fixed();
        this.floorRigidBody = physicsWorld.createRigidBody(floorBody);
        physicsWorld.createCollider(floorCollider,this.floorRigidBody);
        
        
        const cellSize = 20;     // desired size of each cell
        let gridDivisions = Math.floor(chunkSize / cellSize);
        if (gridDivisions % 2 !== 0) gridDivisions += 1;
        const gridHelper = new THREE.GridHelper(chunkSize,gridDivisions,0x000000,0x000000);
        gridHelper.position.y +=  floorHeight / 2 + 0.01;// slightly above floor surface
        this.floorModel.add(gridHelper)


        const floorPosY = floorHeight/2 + chunkPos.y;//to fix the situation where half of it is above and half is below the specfied ground level
        this.floorRigidBody.setTranslation({x:chunkPos.x,y:floorPosY,z:chunkPos.z},true);
        this.floorModel.position.copy(this.floorRigidBody.translation());
        if (floorContent) this.floorModel.add(floorContent.content);
    }    
    public cleanUp():void {
        if (this.floorRigidBody) {
            physicsWorld.removeRigidBody(this.floorRigidBody);
            this.floorRigidBody = null;
        }
        if (this.floorContent) {//this has to be done before clearing the hieararchy of the floor model
            this.floorContent.cleanUpPhysics();
        }
        if (this.floorModel) {
            disposeHierarchy(this.floorModel);
            if (this.parent) {
                this.parent.remove(this.floorModel);
            }
            this.floorModel = null;
        }
    }
}