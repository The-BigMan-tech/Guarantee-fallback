import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d";
import { physicsWorld } from "../physics-world.three";
import { disposeHierarchy } from "../disposer/disposer.three";
import type { FloorContent } from "./floor-content.three";

export interface FloorData {
    cords:THREE.Vector3
    volume:THREE.Vector3,
    gridDivisions:number,
    parent:THREE.Group
}
export class Floor {
    public floorModel:THREE.Group | null;
    private floorRigidBody:RAPIER.RigidBody | null;
    private floorContent:FloorContent | null;
    private parent:THREE.Group;//this will be the group of floors held by the terrain manager

    constructor(floorData:FloorData,floorContent:FloorContent | null) {
        this.floorContent = floorContent;
        this.floorModel = new THREE.Group();
        this.parent = floorData.parent;
        const {cords,volume,gridDivisions} = floorData;
        
        const floorHeight = volume.y;
        const floorGeometry = new THREE.BoxGeometry(volume.x,floorHeight,volume.z);
        const floorMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
        const floorMesh = new THREE.Mesh(floorGeometry,floorMaterial);
        this.floorModel.add(floorMesh);
        floorMesh.receiveShadow = true;
        
        const floorCollider = RAPIER.ColliderDesc.cuboid(volume.x/2,floorHeight/2,volume.z/2);
        const floorBody = RAPIER.RigidBodyDesc.fixed();
        this.floorRigidBody = physicsWorld.createRigidBody(floorBody);
        physicsWorld.createCollider(floorCollider,this.floorRigidBody);
        
        const gridSize = floorData.volume.x
        const gridHelper = new THREE.GridHelper(gridSize,gridDivisions,0x000000,0x000000);
        gridHelper.position.y +=  floorHeight / 2 + 0.01;// slightly above floor surface
        this.floorModel.add(gridHelper)


        const floorPosY = floorHeight/2 + cords.y;//to fix the situation where half of it is above and half is below the specfied ground level
        this.floorRigidBody.setTranslation({x:cords.x,y:floorPosY,z:cords.z},true);
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