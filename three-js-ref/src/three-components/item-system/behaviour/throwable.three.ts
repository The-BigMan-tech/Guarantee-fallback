import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ItemClone, ItemClones } from "./core/item-clone.three";
import type { ItemBody } from "./core/types";
import { ItemUtils } from "./core/item-utils.three";
import { itemManager } from "../item-manager.three";

export class Throwable implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public  static group:THREE.Group = new THREE.Group()

    private data:ItemBody;
    private model:THREE.Group | null = null; 
    
    constructor(data:ItemBody) {
        this.data = data;
        Throwable.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
            ItemUtils.applyMaterialToModel(this.model,0,1)
        })
    }
    public use(view:THREE.Group,eyeLevel:number,itemID:string,userStrength:number):void {
        if (this.model) {
            const spawnData = ItemUtils.getSpawnPosition(view,eyeLevel)
            const clone = new ItemClone(Throwable.group,this.model,spawnData.spawnPosition,this.data)
            ItemClones.clones.push(clone)
            Throwable.group.add(clone.mesh);
            const throwImpulse = spawnData.direction.multiplyScalar(userStrength);
            clone.rigidBody?.applyImpulse(throwImpulse, true);
            itemManager.removeFromInventory(itemID)
        }
    }
}