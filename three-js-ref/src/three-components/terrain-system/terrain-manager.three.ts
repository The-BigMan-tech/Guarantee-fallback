import * as THREE from "three"
import { Floor, type FloorData } from "./floor.three";
import { groundLevelY } from "../physics-world.three";
import { player } from "../player/player.three";
import { FloorContent } from "./floor-content.three";

type ChunkKey = string;
type Singleton<T> = T;

class TerrainManager {
    private static manager:TerrainManager;

    public floorGroup:THREE.Group = new THREE.Group();
    private loadedFloors: Map<ChunkKey, Floor> = new Map();

    private chunkSize = 10;  // size of each floor chunk
    private loadRadius = 2;    // how many chunks away to load (1 means 3x3 grid)

    private constructor() {};
    public static get instance():TerrainManager {
        if (!TerrainManager.manager)  {
            TerrainManager.manager = new TerrainManager();
        }
        return TerrainManager.manager;
    }
    private createFloorAtChunk(x: number, z: number): Floor {
        const chunkCords = new THREE.Vector3(//Multiplying by chunkSize gives the corner position of the chunk.Adding (chunkSize / 2) shifts this to the center of the chunk.
            (x * this.chunkSize) + (this.chunkSize / 2),
            groundLevelY,
            (z * this.chunkSize) + (this.chunkSize / 2)
        );
        const floorData: FloorData = {
            cords:chunkCords,
            volume: new THREE.Vector3(this.chunkSize, 1, this.chunkSize),
            gridDivisions:this.chunkSize/20,
            parent: this.floorGroup,
        };
        const floorContentData = {
            groundArea:this.chunkSize,
            minDistance:40, // or any spacing you want
        };
        const floorContent = new FloorContent(floorContentData,chunkCords);
        const floor = new Floor(floorData,floorContent);
        return floor;
    }

    private getChunkCoords(position: THREE.Vector3): { x: number; z: number } {
        return {//these are chunk grid cords.to get the world cords,you multiply it by the chunk size and optionally center them
            x: Math.floor(position.x / this.chunkSize),
            z: Math.floor(position.z / this.chunkSize),
        };
    }
    private chunkKey(x: number, z: number): ChunkKey {//we are using string keys cuz we want to check for chunks by coordinates not reference identity as it will be be if we used vectors directly as the keys
        return `${x}_${z}`;
    }
    public updateTerrain() {
        const playerChunk = this.getChunkCoords(player.position);
        const chunksToKeep = new Set<ChunkKey>();

        for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
            for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
                const chunkX = playerChunk.x + dx;
                const chunkZ = playerChunk.z + dz;
                const key = this.chunkKey(chunkX, chunkZ);
                chunksToKeep.add(key);
                if (!this.loadedFloors.has(key)) {// Load new floor chunk
                    const floor = this.createFloorAtChunk(chunkX, chunkZ);
                    this.loadedFloors.set(key, floor);
                    console.log("chunk loader.");
                }
            }
        }
        // Unload floors out of range
        for (const [key, floor] of this.loadedFloors.entries()) {
            if (!chunksToKeep.has(key)) {
                floor.cleanUp();
                this.loadedFloors.delete(key);
            }
        }
    }
}
export const terrainManager:Singleton<TerrainManager> = TerrainManager.instance;