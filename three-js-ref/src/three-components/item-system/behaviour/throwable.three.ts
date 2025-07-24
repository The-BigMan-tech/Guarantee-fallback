import type { ItemUsageDependecies,ItemBehaviour } from "./core/types";
import * as THREE from "three";
import { RigidBodyClone } from "./core/rigidbody-clone.three";
import { RigidBodyClones } from "./core/rigidbody-clones.three";
import type { PlaceableItemConfig } from "./core/types";
import { ItemUtils } from "./core/item-utils.three";
import { itemManager } from "../item-manager.three";
import { gltfLoader } from "../../gltf-loader.three";

export class Throwable implements ItemBehaviour {
    private _placeableConfig:PlaceableItemConfig;
    private model:THREE.Group | null = null; 

    constructor(placeableConfig:PlaceableItemConfig) {
        this._placeableConfig = placeableConfig;
        gltfLoader.load(this._placeableConfig.modelPath,gltf=>{
            this.model = gltf.scene;
            ItemUtils.applyMaterialToModel(this.model,0,1)
        })
    }
    public use(args:ItemUsageDependecies):void {
        const {view,userHorizontalQuaternion,itemID,userStrength} = args
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,this._placeableConfig.spawnDistance);
            const clone = RigidBodyClone.createClone({
                itemID,
                canPickUp:this._placeableConfig.canPickUp,
                model:this.model,
                spawnPosition,
                spawnQuaternion:userHorizontalQuaternion,
                properties:this._placeableConfig,
                spinVectorInAir:new THREE.Vector3(1,1,1), //this means spin in all axis while in the air
                parent:RigidBodyClones.group
            });

            const sourceThrow = ItemUtils.getSpawnPosition(view)
            clone.applyKnockback(sourceThrow,userStrength);
            itemManager.removeFromInventory(itemID)
        }
    }
    get placeableConfig() {
        return this._placeableConfig;
    }
}