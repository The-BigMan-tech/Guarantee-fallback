import * as THREE from 'three'
import PoissonDiskSampling from 'poisson-disk-sampling';
import { startingLevelY } from '../physics-world.three';
import { randFloat } from 'three/src/math/MathUtils.js';
import { ItemClone } from '../item-system/behaviour/core/item-clone.three';
import { gltfLoader } from '../gltf-loader.three';

export interface FloorContentData {
    chunkSize:number,
    minDistance:number,
}
export class FloorContent {
    public  content:THREE.Group = new THREE.Group();//the group that holds all of the content that will be placed on the floor.there should only be one fall content added to the floor at a time.so it means that any new content should be added here not to the floor directly
    private clones:ItemClone[] = [];

    private chunkSize:number;
    private chunkPos:THREE.Vector3;
    private minDistance:number;

    constructor(chunkSize:number,chunkPos:THREE.Vector3,minDistance:number) {
        this.chunkSize = chunkSize;
        this.chunkPos = chunkPos;
        this.minDistance = minDistance;
        this.generateDistributions();
    }    
    //ignoring this for this part of the development
    private generateDistributions() {
        const pds = new PoissonDiskSampling({
            shape: [this.chunkSize,this.chunkSize], // width and depth of sampling area
            minDistance:this.minDistance,
            tries: 10
        });
        const points = pds.fill(); // array of [x, z] points
        for (let i = 0; i < points.length; i++) {
            const [x, z] = points[i];
        
            const height = randFloat(3,3);
            
            const localY = startingLevelY + height/2 ;//to make it stand on the startinglevl not that half of it is above and another half above
            const localX = x - this.chunkSize / 2;
            const localZ = z - this.chunkSize / 2;

            const worldX = this.chunkPos.x + localX;
            const worldZ = this.chunkPos.z + localZ;

            const spawnPosition = new THREE.Vector3(worldX,localY,worldZ);
            gltfLoader.load('./block/block.glb',gltf=>{
                const model = gltf.scene;
                const clone = ItemClone.createClone({
                    model:model,
                    spawnPosition,
                    spawnQuaternion:new THREE.Quaternion(),
                    spinVectorInAir:new THREE.Vector3(1,1,1), //this means spin in all axis while in the air
                    addToScene:false,
                    properties:{
                        density:2,
                        width:3,
                        height,
                        depth:3,
                        durability:40
                    }
                });
                this.content.add(clone.mesh);
                this.clones.push(clone);
            })
        }
    }
    public cleanUpClones() {
        for (const clone of this.clones) {
            clone.cleanUp();
        }
    }
}