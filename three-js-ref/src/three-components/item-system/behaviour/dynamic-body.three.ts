import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"
import { Camera } from "../../camera/camera.three";

interface DynamicBodyData {
    modelPath:string,
    width:number,
    height:number,
    depth:number
}
export class DynamicBody implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public static dynamicBodyGroup:THREE.Group = new THREE.Group()

    private data:DynamicBodyData;
    private model:THREE.Group | null = null;

    constructor(data:DynamicBodyData) {
        this.data = data;
        DynamicBody.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(customCamera:Camera) {
        if (this.model) {
            const lookAtDistance = 5;
            const clone = this.model.clone(true);
            const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
            customCamera.cam3D.getWorldPosition(spawnPosition);
                    
            const forwardVector = new THREE.Vector3(0, 0,-1).applyQuaternion(customCamera.cam3D.getWorldQuaternion(new THREE.Quaternion()));
            forwardVector.multiplyScalar(lookAtDistance)
            spawnPosition.add(forwardVector)
            clone.position.copy(spawnPosition);

            DynamicBody.dynamicBodyGroup.add(clone);
            console.log('model has loaded');
        }
    }
}