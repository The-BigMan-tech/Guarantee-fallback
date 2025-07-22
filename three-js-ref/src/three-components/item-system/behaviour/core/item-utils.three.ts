import * as THREE from "three"



export class ItemUtils {
    constructor() {}
    public static getSpawnPosition(view:THREE.Group,eyeLevel:number):THREE.Vector3 {
        const lookAtDistance = 5;
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        view.getWorldPosition(spawnPosition);    

        const forwardVector = new THREE.Vector3(0,0,-1)
            .applyQuaternion(view.getWorldQuaternion(new THREE.Quaternion()))
            .normalize()
            .multiplyScalar(lookAtDistance);

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