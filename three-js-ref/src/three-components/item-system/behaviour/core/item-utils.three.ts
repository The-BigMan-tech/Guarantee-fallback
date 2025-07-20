import { Camera } from "../../../camera/camera.three";
import * as THREE from "three"

export class ItemUtils {
    constructor() {}
    public static getSpawnPosition(customCamera:Camera):THREE.Vector3 {
        const lookAtDistance = 5;
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        customCamera.cam3D.getWorldPosition(spawnPosition);             
        const forwardVector = new THREE.Vector3(0, 0,-1).applyQuaternion(customCamera.cam3D.getWorldQuaternion(new THREE.Quaternion()));
        forwardVector.multiplyScalar(lookAtDistance)
        spawnPosition.add(forwardVector);
        return spawnPosition;
    }
}