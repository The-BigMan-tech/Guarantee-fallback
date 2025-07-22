import * as THREE from "three"

export class ItemUtils {
    constructor() {}
    public static getSpawnPosition(view:THREE.Group,spawnDistance?:number):THREE.Vector3 {
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        view.getWorldPosition(spawnPosition);    

        const forwardVector = new THREE.Vector3(0,0,-1)
            .applyQuaternion(view.getWorldQuaternion(new THREE.Quaternion())).normalize();

        if (spawnDistance) forwardVector.multiplyScalar(spawnDistance);
        spawnPosition.add(forwardVector);
        return spawnPosition
    }
    public static applyMaterialToModel(model:THREE.Group<THREE.Object3DEventMap>,metalness:number,roughness:number) {
        model.traverse((obj) => {//apply a metallic material
            if (!(obj instanceof THREE.Mesh)) return
            if (obj.material && obj.material.isMeshStandardMaterial) {
                obj.material.metalness = metalness; 
                obj.material.roughness = roughness;   
                obj.material.needsUpdate = true;
            }
        });
    }
}