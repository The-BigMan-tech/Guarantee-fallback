import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"
import { ItemUtils } from "./core/item-utils.three";
import type { ItemBody } from "./core/types";
import { ItemClone } from "./core/item-clone.three";
import { itemManager } from "../item-manager.three";
import { gltfLoader } from "../../gltf-loader.three";


export class DynamicBody implements ItemBehaviour {
    private data:ItemBody;
    private model:THREE.Group | null = null; 

    constructor(data:ItemBody) {
        this.data = data;
        gltfLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(view:THREE.Group,itemID:string) {
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,this.data.spawnDistance); 

            ItemClone.createClone({
                model:this.model,
                spawnPosition,
                properties:this.data,
                spinVectorInAir:new THREE.Vector3(0,0,0),//this means dont spin in any axis while in the air
            })
            itemManager.removeFromInventory(itemID)
        }
    }
}