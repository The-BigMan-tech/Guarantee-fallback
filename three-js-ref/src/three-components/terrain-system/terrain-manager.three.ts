import * as THREE from "three"
import { groundLevelY } from "../physics-world.three";
import { player } from "../player/player.three";
import { Chunk,type ChunkData } from "./chunk.three";
import { Terrain } from "./terrain.three";
import { TerrainColliders } from "./terrain-colliders.three";

type ChunkKey = string;
type Singleton<T> = T;

class TerrainManager {
    private static manager:TerrainManager;
    public  chunkGroup:THREE.Group = new THREE.Group();
    private loadedChunks: Map<ChunkKey,Chunk> = new Map();
    private chunkSize = 70;  // size of each floor chunk
    private loadRadius = 1;    // how many chunks away to load (1 means 3x3 grid)

    private constructor() {};
    public static get instance():TerrainManager {
        if (!TerrainManager.manager)  {
            TerrainManager.manager = new TerrainManager();
        }
        return TerrainManager.manager;
    }
    private x:TerrainColliders | null = null;
    private createChunk = (x: number, z: number):Chunk => {
        const worldChunkCords = new THREE.Vector3(//Multiplying by chunkSize gives the corner position of the chunk.Adding (chunkSize / 2) shifts this to the center of the chunk.
            (x * this.chunkSize) + (this.chunkSize / 2),
            groundLevelY,
            (z * this.chunkSize) + (this.chunkSize / 2)
        );
        const chunkData:ChunkData = {
            cords:worldChunkCords,
            volume:new THREE.Vector3(this.chunkSize, 1, this.chunkSize),
            parent:this.chunkGroup,
        };
        const terrain:Terrain = new Terrain(this.chunkSize);
        const chunk = new Chunk(chunkData,terrain);
        this.x = new TerrainColliders(worldChunkCords,this.chunkSize,terrain.voxelGrid);
        return chunk;
    }

    private chunkKey(x: number, z: number): ChunkKey {//we are using string keys cuz we want to check for chunks by coordinates not reference identity as it will be be if we used vectors directly as the keys
        return `${x}_${z}`;
    }
    private generateChunk(loadedChunks:Map<ChunkKey,Chunk>,chunkSize:number,loadRadius:number,func:(x: number, z: number)=>Chunk) {
        const playerChunk =  {//these are chunk grid cords.to get the world cords,you multiply it by the chunk size and optionally center them
            x: Math.floor(player.position.x / chunkSize),
            z: Math.floor(player.position.z / chunkSize),
        };
        const chunksToKeep = new Set<ChunkKey>();
        for (let dx = -loadRadius; dx <= loadRadius; dx++) {
            for (let dz = -loadRadius; dz <= loadRadius; dz++) {
                const chunkX = playerChunk.x + dx;
                const chunkZ = playerChunk.z + dz;
                const key = this.chunkKey(chunkX, chunkZ);
                chunksToKeep.add(key);
                if (!loadedChunks.has(key)) {// Load new floor chunk
                    const chunk = func(chunkX,chunkZ)
                    loadedChunks.set(key,chunk);
                    console.log("chunk loader.");
                }
            }
        }
        // Unload floors out of range
        for (const [key, chunk] of loadedChunks.entries()) {
            if (!chunksToKeep.has(key)) {
                chunk.cleanUp();
                loadedChunks.delete(key);
            }
        }
    }
    public updateTerrain() {
        this.generateChunk(this.loadedChunks,this.chunkSize,this.loadRadius,this.createChunk);//must be called first so that the second one uses the modified voxel grid data
    
    }
}
export const terrainManager:Singleton<TerrainManager> = TerrainManager.instance;