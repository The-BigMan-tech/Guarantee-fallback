import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ItemClone } from "./core/item-clone.three";
import type { ItemBody } from "./core/types";
import { ItemUtils } from "./core/item-utils.three";
import { itemManager } from "../item-manager.three";

export class Throwable implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
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
            const spawnPosition = ItemUtils.getSpawnPosition(view,eyeLevel);
            const clone = ItemClone.createClone({
                model:this.model,
                spawnPosition,
                properties:this.data,
                spinVectorInAir:new THREE.Vector3(1,1,1)//this means spin in all axis while in the air
            });
            const sourceThrow = view.getWorldPosition(new THREE.Vector3)
            clone.applyKnockback(sourceThrow,userStrength);
            itemManager.removeFromInventory(itemID)
        }
    }
}