import { Camera } from "../../../camera/camera.three";
import * as THREE from "three"

export interface SpawnData {
    spawnPosition:THREE.Vector3,
    direction:THREE.Vector3
}
export class ItemUtils {
    constructor() {}
    public static getSpawnPosition(customCamera:Camera):SpawnData {
        const lookAtDistance = 5;
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        customCamera.cam3D.getWorldPosition(spawnPosition);             
        const forwardVector = new THREE.Vector3(0, 0,-1)
            .applyQuaternion(customCamera.cam3D.getWorldQuaternion(new THREE.Quaternion()))
            .normalize();//i normalized it to ensure its a unit vector
        forwardVector.multiplyScalar(lookAtDistance)
        spawnPosition.add(forwardVector);
        return {spawnPosition,direction:forwardVector};
    }
}