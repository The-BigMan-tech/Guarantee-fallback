import * as THREE from "three"
import { ItemClone } from "./item-clone.three";
import type { ItemCloneData } from "./types";

export interface SpawnData {
    spawnPosition:THREE.Vector3,
    direction:THREE.Vector3
}
export class ItemUtils {
    constructor() {}
    public static getSpawnPosition(view:THREE.Group,eyeLevel:number):SpawnData {
        const lookAtDistance = 5;
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        view.getWorldPosition(spawnPosition);             
        const forwardVector = new THREE.Vector3(0, 0,-1)
            .applyQuaternion(view.getWorldQuaternion(new THREE.Quaternion()))
            .normalize();//i normalized it to ensure its a unit vector
        forwardVector.multiplyScalar(lookAtDistance)
        spawnPosition.add(forwardVector.clone().setY(eyeLevel));
        return {spawnPosition,direction:forwardVector};
    }
    public static spawnItemClone(args:{view:THREE.Group,eyeLevel:number,group:THREE.Group,model:THREE.Group,cloneData:ItemCloneData,clones:ItemClone[]}):ItemClone {
        const spawnData = ItemUtils.getSpawnPosition(args.view,args.eyeLevel)
        const clone = new ItemClone(args.group,args.model.clone(),spawnData.spawnPosition,args.cloneData)
        args.group.add(clone.mesh);
        args.clones.push(clone);
        return clone
    }
}