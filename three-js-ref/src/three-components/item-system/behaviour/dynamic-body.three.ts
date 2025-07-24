import type { ItemBehaviour,ItemUsageDependecies } from "./core/types";
import * as THREE from "three"
import { ItemUtils } from "./core/item-utils.three";
import type { ItemBody } from "./core/types";
import { RigidBodyClone } from "./core/rigidbody-clone.three";
import { RigidBodyClones } from "./core/rigidbody-clones.three";
import { itemManager } from "../item-manager.three";
import { gltfLoader } from "../../gltf-loader.three";

//Item behaviour classes dont extend rigid body clone nor are composed by it.they rather create clones of rigid bodies on the fly using the provided data.They add behaviour by manipulating clones.ill add hooks so that they can plug in behaviour into the clone they spawn
export class DynamicBody implements ItemBehaviour {
    private _itemBody:ItemBody;
    private model:THREE.Group | null = null; 

    constructor(itemBody:ItemBody) {
        this._itemBody = itemBody;
        gltfLoader.load(this._itemBody.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(args:ItemUsageDependecies) {
        const {view,userHorizontalQuaternion,itemID} = args
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(view,this._itemBody.spawnDistance); 
            RigidBodyClone.createClone({
                itemID,
                canPickUp:this._itemBody.canPickUp,
                model:this.model,
                spawnPosition,
                spawnQuaternion:userHorizontalQuaternion,
                properties:this._itemBody,
                spinVectorInAir:new THREE.Vector3(0,0,0),//this means dont spin in any axis while in the air
                parent:RigidBodyClones.group
            })
            itemManager.removeFromInventory(itemID)
        }
    }
    get itemBody() {
        return this._itemBody;
    }
}