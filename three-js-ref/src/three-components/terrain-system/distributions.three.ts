import * as THREE from 'three'
import { EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { physicsWorld } from '../physics-world.three';
import * as RAPIER from '@dimforge/rapier3d'
import PoissonDiskSampling from 'poisson-disk-sampling';
import { startingLevelY } from '../physics-world.three';
import { randFloat } from 'three/src/math/MathUtils.js';


export class Distributions {
    public  content:THREE.Group = new THREE.Group();//the group that holds all of the content that will be placed on the floor.there should only be one fall content added to the floor at a time.so it means that any new content should be added here not to the floor directly
    private contentRigidBodies:RAPIER.RigidBody[] = [];//it holds the rigid boides for all the content for cleanup
    
    private chunkSize:number;
    private minDistance:number;
    private chunkPos:THREE.Vector3;

    constructor(chunkPos:THREE.Vector3,chunkSize:number,minDistance:number) {
        this.chunkPos = chunkPos;
        this.chunkSize = chunkSize;
        this.minDistance = minDistance
        this.generateDistributions();
    }  
    private generateDistributions() {
        const pds = new PoissonDiskSampling({
            shape: [this.chunkSize,this.chunkSize], // width and depth of sampling area
            minDistance:this.minDistance,
            tries: 10
        });
        const points = pds.fill(); // array of [x, z] points
        const tallCubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x4f4f4f});
        const minHeight = 3//im not exposing these as part of the interface cuz the cubes are just placeholders for content like trees,structures but not blocks for terrain cuz that one will use a different algorithm for placement.so the interface shouldnt be tied to speciic content till i make sub or behaviour classes
        const maxHeight = 3
        const width = 20;

        for (let i = 0; i < points.length; i++) {
            const [x, z] = points[i];
        
            const height = randFloat(minHeight,maxHeight);
            const posY = height / 2 + startingLevelY;//to make it stand on the startinglevl not that half of it is above and another half above
            
            const localX = x - this.chunkSize / 2;
            const localZ = z - this.chunkSize / 2;

            const tallCubeGeometry = new THREE.BoxGeometry(width,height,width);
            const tallCube = new THREE.Mesh(tallCubeGeometry,tallCubeMaterial)
            const tallCubeEdges = new EdgesGeometry(tallCubeGeometry);
            const tallCubeLine = new LineSegments(tallCubeEdges, new LineBasicMaterial({ color: 0x000000 }));
            tallCube.add(tallCubeLine)
        
            const tallCubeCollider = RAPIER.ColliderDesc.cuboid(width/2,height/2,width/2);
            tallCubeCollider.setFriction(0.5)
            const tallCubeBody = RAPIER.RigidBodyDesc.fixed();
            const tallCubeRigidBody = physicsWorld.createRigidBody(tallCubeBody);
            physicsWorld.createCollider(tallCubeCollider,tallCubeRigidBody);
            
            const worldX = this.chunkPos.x + localX;
            const worldZ = this.chunkPos.z + localZ;

            tallCubeRigidBody.setTranslation({x:worldX,y:posY,z:worldZ},true)
            tallCube.position.set(localX,posY, localZ);

            this.content.add(tallCube);
            this.contentRigidBodies.push(tallCubeRigidBody);
        }
    }
    public cleanUpPhysics(): void {
        for (const rigidBody of this.contentRigidBodies) {
            physicsWorld.removeRigidBody(rigidBody);
        }
        this.contentRigidBodies.length = 0; // Clear the array,removing all refs and allowing for gc
    }
}