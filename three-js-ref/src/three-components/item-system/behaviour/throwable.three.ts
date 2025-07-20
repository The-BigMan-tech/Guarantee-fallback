import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ItemClone } from "./core/item-clone.three";
import type { ItemCloneData } from "./core/types";
import { ItemUtils } from "./core/item-utils.three";
import type { Camera } from "../../camera/camera.three";
import { itemManager } from "../item-manager.three";

export class Throwable implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public  static group:THREE.Group = new THREE.Group()
    public  static clones:ItemClone[] = []//this is for the player to get the looked at clone and dispose its reources when removing it

    private data:ItemCloneData;
    private model:THREE.Group | null = null; 
    
    constructor(data:ItemCloneData) {
        this.data = data;
        Throwable.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(customCamera:Camera,itemID:string):void {
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(customCamera)
            const clone = new ItemClone(Throwable.group,this.model.clone(),spawnPosition,this.data)
            Throwable.group.add(clone.mesh);
            Throwable.clones.push(clone);
            itemManager.removeFromInventory(itemID)
        }
    }
    public static updateClones() {
        for (const clone of Throwable.clones) {
            clone.updateClone()
        }
    }
}