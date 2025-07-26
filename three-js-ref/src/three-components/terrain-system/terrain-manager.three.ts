import * as THREE from "three"
import { Chunk, type ChunkData } from "./chunk.three";
import { groundLevelY } from "../physics-world.three";
import { player } from "../player/player.three";
import { Distributions } from "./distributions.three";

type ChunkKey = string;
type Singleton<T> = T;

class TerrainManager {
    private static manager:TerrainManager;

    public  chunkParent:THREE.Group = new THREE.Group();
    private loadedChunks: Map<ChunkKey, Chunk> = new Map();

    private chunkSize = 50;  // size of each floor chunk
    private loadRadius = 1;    // how many chunks away to load (1 means 3x3 grid)

    private constructor() {};
    public static get instance():TerrainManager {
        if (!TerrainManager.manager)  {
            TerrainManager.manager = new TerrainManager();
        }
        return TerrainManager.manager;
    }
    private createChunk(x: number, z: number):Chunk {
        const chunkPos = new THREE.Vector3(//Multiplying by chunkSize gives the corner position of the chunk.Adding (chunkSize / 2) shifts this to the center of the chunk.
            (x * this.chunkSize) + this.chunkSize / 2,
            groundLevelY,
            (z * this.chunkSize) + this.chunkSize / 2
        );
        const chunkData:ChunkData = {
            chunkPos:chunkPos,
            chunkSize:this.chunkSize,
            chunkParent: this.chunkParent,
        };
        const distributions = new Distributions(this.chunkSize,chunkPos,40);
        return new Chunk(chunkData,distributions);
    }


    private chunkKey(x: number, z: number): ChunkKey {//we are using string keys cuz we want to check for chunks by coordinates not reference identity as it will be be if we used vectors directly as the keys
        return `${x}_${z}`;
    }
    public updateTerrain() {
        const playerChunk =  {//these are chunk grid cords.to get the world cords,you multiply it by the chunk size and optionally center them
            x: Math.floor((player.position.x  + this.chunkSize / 2) / this.chunkSize),
            z: Math.floor((player.position.z  +  this.chunkSize / 2) / this.chunkSize),
        };
        const chunksToKeep = new Set<ChunkKey>();
        for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
            for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
                const chunkX = playerChunk.x + dx;
                const chunkZ = playerChunk.z + dz;
                const key = this.chunkKey(chunkX, chunkZ);
                chunksToKeep.add(key);
                if (!this.loadedChunks.has(key)) {// Load new floor chunk
                    const chunk = this.createChunk(chunkX, chunkZ);
                    this.loadedChunks.set(key, chunk);
                    console.log("chunk loader.");
                }
            }
        }
        // Unload floors out of range
        for (const [key, chunk] of this.loadedChunks.entries()) {
            if (!chunksToKeep.has(key)) {
                chunk.cleanUp();
                this.loadedChunks.delete(key);
                console.log('deleted a chunk');
            }
        }
    }
}
export const terrainManager:Singleton<TerrainManager> = TerrainManager.instance;