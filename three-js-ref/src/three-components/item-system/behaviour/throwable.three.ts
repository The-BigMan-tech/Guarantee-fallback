import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three";
import { ItemClone } from "./core/item-clone.three";
import type { ItemBody } from "./core/types";
import { ItemUtils } from "./core/item-utils.three";
import { itemManager } from "../item-manager.three";
import { gltfLoader } from "../../gltf-loader.three";

export class Throwable implements ItemBehaviour {
    private _itemBody:ItemBody;
    private model:THREE.Group | null = null; 

    constructor(itemBody:ItemBody) {
        this._itemBody = itemBody;
        gltfLoader.load(this._itemBody.modelPath,gltf=>{
            this.model = gltf.scene;
            ItemUtils.applyMaterialToModel(this.model,0,1)
        })
    }
    public use(view:THREE.Group,itemID:string,userStrength:number,userQuaternion:THREE.Quaternion):void {
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,this._itemBody.spawnDistance);
            const clone = ItemClone.createClone({
                model:this.model,
                spawnPosition,
                spawnQuaternion:userQuaternion,
                properties:this._itemBody,
                spinVectorInAir:new THREE.Vector3(1,1,1),//this means spin in all axis while in the air,
            });

            const sourceThrow = ItemUtils.getSpawnPosition(view)
            clone.applyKnockback(sourceThrow,userStrength);
            itemManager.removeFromInventory(itemID)
        }
    }
    get itemBody() {
        return this._itemBody;
    }
}