import * as THREE from 'three'
import PoissonDiskSampling from 'poisson-disk-sampling';
import { startingLevelY } from '../physics-world.three';
import { randFloat } from 'three/src/math/MathUtils.js';
import { RigidBodyClone } from '../item-system/behaviour/core/rigidbody-clone.three';
import { gltfLoader } from '../gltf-loader.three';


export class Distributions {
    public  content:THREE.Group = new THREE.Group();//the group that holds all of the content that will be placed on the floor.there should only be one fall content added to the floor at a time.so it means that any new content should be added here not to the floor directly
    private clones:RigidBodyClone[] = [];

    private chunkSize:number;
    private chunkPos:THREE.Vector3;
    private minDistance:number;

    constructor(chunkSize:number,chunkPos:THREE.Vector3,minDistance:number) {
        this.chunkSize = chunkSize;
        this.chunkPos = chunkPos;
        this.minDistance = minDistance;
    }    
    //ignoring this for this part of the development
    public generateDistributions() {
        const pds = new PoissonDiskSampling({
            shape: [this.chunkSize,this.chunkSize], // width and depth of sampling area
            minDistance:this.minDistance,
            tries: 10
        });
        const points = pds.fill(); // array of [x, z] points
        for (let i = 0; i < points.length; i++) {
            const [x, z] = points[i];
        
            const height = randFloat(1,15);
            
            const localY = startingLevelY + height/2 ;//to make it stand on the startinglevl not that half of it is above and another half above
            const localX = x - this.chunkSize / 2;
            const localZ = z - this.chunkSize / 2;

            const worldX = this.chunkPos.x + localX;
            const worldZ = this.chunkPos.z + localZ;

            const spawnPosition = new THREE.Vector3(worldX,localY,worldZ);
            gltfLoader.load('./block/block.glb',gltf=>{//ill change this to spawn differnt types of clones like trees or rocks.but this will do for now
                const model = gltf.scene;
                const clone = RigidBodyClone.createClone({
                    itemID:'block',
                    canPickUp:false,
                    model:model,
                    spawnPosition,
                    spawnQuaternion:new THREE.Quaternion(),
                    spinVectorInAir:new THREE.Vector3(1,1,1), //this means spin in all axis while in the air
                    parent:this.content,
                    owner:'Game',//it spawned naturally so its owned by the game
                    properties:{
                        density:1,
                        width:15,//im using the height here for width and depth to get a cube unit.this will  depending on the model
                        height:height,
                        depth:15,
                        durability:10
                    }
                });
                this.clones.push(clone);
                // makeGroupTransparent(clone.group);
            })
        }
    }
    public cleanUpClones() {
        for (const clone of this.clones) {
            clone.cleanUp();
        }
    }
}