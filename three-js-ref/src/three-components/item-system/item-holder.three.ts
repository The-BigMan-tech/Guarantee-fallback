import * as THREE from "three";
import type { Item } from "./behaviour/core/types";
import { disposeHierarchy } from "../disposer/disposer.three";
import { gltfLoader } from "../gltf-loader.three";

export class ItemHolder {
    private item3D: THREE.Group;
    private currentHeldItem: string | null = null;

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
    private loadItemModel(item:Item) {
        this.disposeItem(); // Remove previous model from item3D
        const clonedModel = item.scene!.clone(true); // Deep clone
        const transform = item.transformInHand;
        clonedModel.scale.copy(transform.scale); // Scale to 50% in all dimensions
        clonedModel.position.copy(transform.position);
        clonedModel.rotation.copy(transform.rotation);
        this.item3D.add(clonedModel);// Clone before adding
    }
    public holdItem(item:Item | null) {//called on loop
        const heldItem = item ? item.name : null;
        if (heldItem !== this.currentHeldItem) {
            this.currentHeldItem = heldItem;
            console.log('holding currentHeldItemID:',this.currentHeldItem);
            if (!item) {
                this.disposeItem();
                return
            }
            if (item.scene) {//reuse the scene if already loaded
                console.log('used item scene');
                this.loadItemModel(item)
                return
            }else {
                gltfLoader.load(item.modelPath,gltf=>{
                    item.scene = gltf.scene;
                    this.loadItemModel(item)
                });
            }
        }
    }
}