import * as THREE from "three"
import { Floor, type FloorData } from "./floor.three";
import { groundLevelY } from "../physics-world.three";
type Singleton<T> = T;

class TerrainManager {
    private static manager:TerrainManager;
    public floorGroup:THREE.Group = new THREE.Group();

    private constructor() {};
    public static get instance():TerrainManager {
        if (!TerrainManager.manager)  {
            TerrainManager.manager = new TerrainManager();
        }
        return TerrainManager.manager;
    }

    private generateFloor() {
        const floorData:FloorData = {
            cords:new THREE.Vector3(0,groundLevelY,0),
            volume:new THREE.Vector3(1000,1,1000),
            gridDivisions:50,
            parent:this.floorGroup
        }
        const floor = new Floor(floorData)
        if (floor.floorMesh) this.floorGroup.add(floor.floorMesh);
    }
    public updateTerrain() {

    }
}
export const terrainManager:Singleton<TerrainManager> = TerrainManager.instance;