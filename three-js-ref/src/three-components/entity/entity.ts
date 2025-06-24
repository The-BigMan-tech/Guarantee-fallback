import { Controller} from "../controller/controller.three";
import type {FixedControllerData,DynamicControllerData,CollisionMap} from "../controller/controller.three";
import * as RAPIER from "@dimforge/rapier3d"
import { player } from "../player/player.three";
import dijkstra from 'dijkstrajs';

interface Graph {
    [nodeKey: string]: {
      [neighborKey: string]: number  // edge weight (distance)
    }
}
class Entity extends Controller {
    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData) {
        super(fixedData,dynamicData);
    }
    protected onLoop(): void {
        this.pathTargetPos = player.position
        this.wakeUpBody()
    }
    protected onRadialDetection(collisionMap: CollisionMap): void {
        const graph: Graph = {};
        console.log("Entity collision map: ",collisionMap);
        const points = collisionMap.points;
        for (const key of points) {
            graph[key] = {};
            const posA = this.keyToVector3(key);
            
            for (const otherKey of points) {
                if (key === otherKey) continue;
                const posB = this.keyToVector3(otherKey);
            
                const distance = posA.distanceTo(posB);
                const maxConnectionDistance = 2; // example threshold
            
                if (distance <= maxConnectionDistance) {
                    graph[key][otherKey] = distance;  // edge weight
                }
            }
        }
        if (!collisionMap.target) return;
        const shortestPath = dijkstra.find_path(graph, collisionMap.start, collisionMap.target);
        shortestPath.forEach((element:string) => {
            const pointVector = this.keyToVector3(element);
            console.log("Point vector: ",pointVector);
        });
        console.log('Entity shortestPath:', shortestPath);
    }
}
const entityFixedData:FixedControllerData = {
    modelPath:'./silvermoon.glb',
    spawnPoint: new RAPIER.Vector3(0,20,-10),
    characterHeight:4,
    characterWidth:1,
    shape:'capsule',
    mass:40,
}
const entityDynamicData:DynamicControllerData = {
    horizontalVelocity:30,
    jumpVelocity:30,
    jumpResistance:15,
    rotationDelta:0.04,
    rotationSpeed:0.4,
    maxStepUpHeight:3,
    gravityScale:1
}
export const entity = new Entity(entityFixedData,entityDynamicData)