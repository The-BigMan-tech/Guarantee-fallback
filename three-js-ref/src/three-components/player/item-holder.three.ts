import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { InventoryItem } from "../item-system/item-manager.three";
import { disposeHierarchy } from "../disposer/disposer.three";

export class ItemHolder {
    private item3D: THREE.Group;
    private currentHeldItemID: string | null = null;
    private modelLoader:GLTFLoader = new GLTFLoader();

    constructor(item3D: THREE.Group) {
        this.item3D = item3D;
    }
    private disposeItem() {
        while (this.item3D.children.length > 0) {
            const child = this.item3D.children[0];
            this.item3D.remove(child);
            disposeHierarchy(child); // Dispose the removed child's geometry/materials/textures etc.
        }
    }

    private loadItemModel(itemInHand: InventoryItem) {
        this.disposeItem(); // Remove previous model from item3D
        const clonedModel = itemInHand.item.scene!.clone(true); // Deep clone
        const transform = itemInHand.item.transform;
        clonedModel.scale.copy(transform.scale); // Scale to 50% in all dimensions
        clonedModel.position.copy(transform.position);
        clonedModel.rotation.copy(transform.rotation);
        this.item3D.add(clonedModel);// Clone before adding
    }

    private holdSelectedItem(itemInHand:InventoryItem | null) {//called on loop
        const heldItemID = itemInHand ? itemInHand.itemID : null;
        if (heldItemID !== this.currentHeldItemID) {
            this.currentHeldItemID = heldItemID;
            console.log('holding currentHeldItemID:',this.currentHeldItemID);
            if (!itemInHand) {
                this.disposeItem();
                return
            }
            if (itemInHand.item.scene) {//reuse the scene if already loaded
                console.log('used item scene');
                this.loadItemModel(itemInHand)
                return
            }else {
                this.modelLoader.load(itemInHand.item.modelPath,gltf=>{
                    itemInHand.item.scene = gltf.scene;
                    this.loadItemModel(itemInHand)
                });
            }
        }
    }
}