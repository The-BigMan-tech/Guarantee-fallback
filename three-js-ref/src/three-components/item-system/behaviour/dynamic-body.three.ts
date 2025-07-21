import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"
import { ItemUtils } from "./core/item-utils.three";
import type { ItemBody } from "./core/types";
import { ItemClone } from "./core/item-clone.three";
import { itemManager } from "../item-manager.three";


export class DynamicBody implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    private data:ItemBody;
    private model:THREE.Group | null = null; 

    constructor(data:ItemBody) {
        this.data = data;
        DynamicBody.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(view:THREE.Group,eyeLevel:number,itemID:string) {
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,eyeLevel); 
            ItemClone.createClone({
                model:this.model,
                spawnPosition,
                properties:this.data,
                spinVectorInAir:new THREE.Vector3(0,0,0)//this means dont spin in any axis while in the air
            })
            itemManager.removeFromInventory(itemID)
        }
    }
}