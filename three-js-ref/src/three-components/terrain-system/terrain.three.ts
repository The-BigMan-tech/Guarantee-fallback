import * as THREE from 'three'
import { startingLevelY } from '../physics-world.three';
import { createNoise2D } from 'simplex-noise';

export class Terrain {
    public  content:THREE.Group = new THREE.Group();//the group that holds all of the content that will be placed on the floor.there should only be one fall content added to the floor at a time.so it means that any new content should be added here not to the floor directly
    private noise2D = createNoise2D();
    private chunkSize:number;
    public voxelGrid:boolean[][][] = [];

    constructor(chunkSize:number) {
        this.chunkSize = chunkSize
        const cubeSize = 2;
        const gridSize = chunkSize/cubeSize;
        const maxTerrainHeight = 30
        this.generateTerrainWithNoise(gridSize,cubeSize,maxTerrainHeight); 
    }
    private generateTerrainWithNoise(gridSize: number, cubeSize: number, heightScale: number) {
        const halfArea = this.chunkSize / 2;
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33}); // example color

        this.voxelGrid = new Array(gridSize)
        for (let x = 0; x < gridSize; x++) {
            this.voxelGrid[x] = new Array(heightScale)
            for (let y = 0; y < heightScale; y++) {
                this.voxelGrid[x][y] = new Array(gridSize).fill(false)
            }
        }
        const voxelPositions: THREE.Vector3[] = [];

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
                    voxelPositions.push(new THREE.Vector3(localX, localY, localZ));
                }
            }
        }
        const instancedMesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, voxelPositions.length);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < voxelPositions.length; i++) {
            dummy.position.copy(voxelPositions[i]);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        this.content.add(instancedMesh);
    }
}