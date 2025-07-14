import * as THREE from 'three'
import { physicsWorld } from '../physics-world.three';
import * as RAPIER from '@dimforge/rapier3d'
import { startingLevelY } from '../physics-world.three';

export class TerrainColliders {
    private contentRigidBodies:RAPIER.RigidBody[] = [];//it holds the rigid boides for all the content for cleanup
    private chunkPos:THREE.Vector3;
    private chunkSize:number;

    constructor(chunkPos:THREE.Vector3,chunkSize:number,voxelGrid:boolean[][][]) {
        this.chunkSize = chunkSize
        this.chunkPos = chunkPos;
        const cubeSize = 2;
        const gridSize = chunkSize/cubeSize;
        this.buildMergedColliders(gridSize, cubeSize,voxelGrid);   
    }
    private buildMergedColliders(gridSize: number, cubeSize: number,voxelGrid:boolean[][][]) {
        // Example: merge vertically contiguous voxels per (x,z) column
        const halfArea = this.chunkSize / 2;
        const standingPointY = startingLevelY + (cubeSize / 2);
    
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                let startY = -1;//-1 indicates no block is currently being tracked.
                const topLayerY = voxelGrid[0].length;//you can use any index since all the x slices have the same y layers
                const overTopLayerY = topLayerY+1
                
                for (let y = 0; y < overTopLayerY; y++) {
                    const isTrackingBlock = (startY !== -1);
                    const isOccupied = (y < topLayerY) && voxelGrid[x][y][z];
                    const atTopLayer = (y === topLayerY);
                    if (isOccupied && !isTrackingBlock) {
                        startY = y;
                    }else if ((!isOccupied || atTopLayer) && isTrackingBlock) {
                        const heightInVoxels = y - startY;
                        this.createMergedCollider({
                            x,              // x index of block start
                            y:startY,         // y index of block start
                            z,              // z index of block start
                            width:1,              // width in voxels (1 for vertical merging)
                            height:heightInVoxels, // height in voxels (length of vertical block)
                            depth:1,              // depth in voxels (1 for vertical merging)
                            cubeSize,       // size of one voxel cube
                            halfArea,       // half ground area for centering
                            standingPointY  // base Y offset
                    });
                        startY = -1;
                    }
                }
            }
        }
    }
    private createMergedCollider(args:{
        x: number,
        y: number,
        z: number,
        width: number,
        height: number,
        depth: number,
        cubeSize: number,
        halfArea: number,
        standingPointY: number
    }) {
        const {x,y,z,width,height,depth,cubeSize,halfArea,standingPointY} = args;
        const halfWidth = (width * cubeSize) / 2;
        const halfHeight = (height * cubeSize) / 2;
        const halfDepth = (depth * cubeSize) / 2;
    
        const colliderDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
        colliderDesc.setFriction(0.5);
    
        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
    
        // Calculate center position in local chunk space
        const localX = (x * cubeSize) - halfArea + halfWidth;
        const localY = (y * cubeSize) + standingPointY + halfHeight;
        const localZ = (z * cubeSize) - halfArea + halfDepth;
    
        // Translate to world coordinates
        const worldX = localX + this.chunkPos.x;
        const worldZ = localZ + this.chunkPos.z;
    
        // Set rigid body position
        rigidBody.setTranslation({ x: worldX, y:localY, z: worldZ }, true);
        physicsWorld.createCollider(colliderDesc, rigidBody);
        this.contentRigidBodies.push(rigidBody);// Store rigid body for cleanup later
    }
    public cleanUpPhysics(): void {
        for (const rigidBody of this.contentRigidBodies) {
            physicsWorld.removeRigidBody(rigidBody);
        }
        this.contentRigidBodies.length = 0; // Clear the array,removing all refs and allowing for gc
    }
}