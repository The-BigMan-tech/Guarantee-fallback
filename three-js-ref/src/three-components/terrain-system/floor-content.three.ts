import * as THREE from 'three'
import { EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { physicsWorld } from '../physics-world.three';
import * as RAPIER from '@dimforge/rapier3d'
import PoissonDiskSampling from 'poisson-disk-sampling';
import { startingLevelY } from '../physics-world.three';
import { randFloat } from 'three/src/math/MathUtils.js';
import { createNoise2D } from 'simplex-noise';

export interface FloorContentData {
    groundArea:number,
    minDistance:number,
}
export class FloorContent {
    public content:THREE.Group = new THREE.Group();//the group that holds all of the content that will be placed on the floor.there should only be one fall content added to the floor at a time.so it means that any new content should be added here not to the floor directly
    private contentRigidBodies:RAPIER.RigidBody[] = [];//it holds the rigid boides for all the content for cleanup
    private noise2D = createNoise2D();

    private floorContentData:FloorContentData;
    private chunkPos:THREE.Vector3;

    constructor(floorContentData:FloorContentData,chunkPos:THREE.Vector3) {
        this.floorContentData = floorContentData;
        this.chunkPos = chunkPos;
        // this.generateScatteredContent();
        const cubeSize = 2;
        const gridSize = this.floorContentData.groundArea/cubeSize;
        const maxTerrainHeight = 10
        this.generateTerrainWithNoise(gridSize,cubeSize,maxTerrainHeight);
        this.buildMergedColliders(gridSize, cubeSize);   
    }
    private voxelGrid: boolean[][][] = []; // 3D grid: x, y, z
    private generateTerrainWithNoise(gridSize: number, cubeSize: number, heightScale: number) {
        const halfArea = this.floorContentData.groundArea / 2;
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x4f4f4f}); // example color
        const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

        this.voxelGrid = new Array(gridSize);
        for (let x = 0; x < gridSize; x++) {
            this.voxelGrid[x] = new Array(heightScale)
            for (let y = 0; y < heightScale; y++) {
                this.voxelGrid[x][y] = new Array(gridSize).fill(false)
            }
        }

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const localX = (x * cubeSize) - halfArea;
                const localZ = (z * cubeSize) - halfArea;

                const noiseSmoothness = 20;
                const noiseValue = this.noise2D(x /noiseSmoothness, z /noiseSmoothness);
                const unsignedNoiseWeight = (noiseValue + 1) / 2;
                const height = Math.floor(unsignedNoiseWeight * heightScale);

                for (let y = 0; y < height; y++) {
                    this.voxelGrid[x][y][z] = true;//voxel is occupied
                    const standingPointY = startingLevelY + (cubeSize / 2);
                    const localY =  (y * cubeSize) + standingPointY;

                    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    const cubeLine = new LineSegments(edgesGeometry,edgesMaterial);
                    cube.add(cubeLine)
                    cube.position.set(localX,localY, localZ);
                    this.content.add(cube);
                }
            }
        }
    }
    private buildMergedColliders(gridSize: number, cubeSize: number) {
        // Example: merge vertically contiguous voxels per (x,z) column
        const halfArea = this.floorContentData.groundArea / 2;
        const standingPointY = startingLevelY + (cubeSize / 2);
    
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                let startY = -1;//-1 indicates no block is currently being tracked.
                const topLayerY = this.voxelGrid[0].length;//you can use any index since all the x slices have the same y layers
                const overTopLayerY = topLayerY+1
                
                for (let y = 0; y < overTopLayerY; y++) {
                    const isTrackingBlock = (startY !== -1);
                    const isOccupied = (y < topLayerY) && this.voxelGrid[x][y][z];
                    const atTopLayer = (y === topLayerY);
                    if (isOccupied && !isTrackingBlock) {
                        startY = y;
                    }else if ((!isOccupied || atTopLayer) && isTrackingBlock) {
                        const heightInVoxels = y - startY;
                        //call create merge collider
                        startY = -1;
                    }
                }
            }
        }
    }
    private generateScatteredContent() {
        const pds = new PoissonDiskSampling({
            shape: [this.floorContentData.groundArea,this.floorContentData.groundArea], // width and depth of sampling area
            minDistance:this.floorContentData.minDistance,
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
            
            const localX = x - this.floorContentData.groundArea / 2;
            const localZ = z - this.floorContentData.groundArea / 2;

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