import type { ItemBehaviour,ItemUsageDependecies } from "./core/types";
import * as THREE from "three"
import { ItemUtils } from "./core/item-utils.three";
import type { PlaceableItemConfig } from "./core/types";
import { RigidBodyClone } from "./core/rigidbody-clone.three";
import { RigidBodyClones } from "./core/rigidbody-clones.three";
import { itemManager } from "../item-manager.three";
import { gltfLoader } from "../../gltf-loader.three";
import { groupIDs } from "../../entity-system/entity-registry";

//Item behaviour classes dont extend rigid body clone nor are composed by it.they rather create clones of rigid bodies on the fly using the provided data.They add behaviour by manipulating clones.ill add hooks so that they can plug in behaviour into the clone they spawn
export class Placeable implements ItemBehaviour {
    private _placeableConfig:PlaceableItemConfig;
    private model:THREE.Group | null = null; 

    constructor(placeableConfig:PlaceableItemConfig) {
        this._placeableConfig = placeableConfig;
        gltfLoader.load(this._placeableConfig.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(args:ItemUsageDependecies) {
        const {view,userHorizontalQuaternion,itemID,owner} = args
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,this._placeableConfig.spawnDistance); 
            RigidBodyClone.createClone({
                itemID,
                canPickUp:this._placeableConfig.canPickUp,
                model:this.model,
                spawnPosition,
                spawnQuaternion:userHorizontalQuaternion,
                properties:this._placeableConfig,
                spinVectorInAir:new THREE.Vector3(0,0,0),//this means dont spin in any axis while in the air
                parent:RigidBodyClones.group,
                owner
            })
            if (owner._groupID === groupIDs.player) {//to prevent entities from mutating the player's inventory
                itemManager.removeFromInventory(itemID)
            }
        }
    }
    get placeableConfig() {
        return this._placeableConfig;
    }
}