import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"
import { ItemUtils } from "./core/item-utils.three";
import type { ItemCloneData } from "./core/types";
import { ItemClone } from "./core/item-clone.three";
import { itemManager } from "../item-manager.three";


export class DynamicBody implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public  static group:THREE.Group = new THREE.Group()
    //i made the clones static even though it makes sense to store clones per instance.this is so that i can access all the clones in one place for cleaning and updating instead of iterating through every item to do this
    public  static clones:ItemClone[] = []//this is for the player to get the looked at clone and dispose its reources when removing it

    private data:ItemCloneData;
    private model:THREE.Group | null = null; 

    constructor(data:ItemCloneData) {
        this.data = data;
        DynamicBody.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(view:THREE.Group,eyeLevel:number,itemID:string) {
        if (this.model) {
            console.log('dynamic model');
            const spawnData = ItemUtils.getSpawnPosition(view,eyeLevel)
            const clone = new ItemClone(DynamicBody.group,this.model.clone(),spawnData.spawnPosition,this.data)
            DynamicBody.group.add(clone.mesh);
            DynamicBody.clones.push(clone);
            itemManager.removeFromInventory(itemID)
        }
    }
    public static updateClones() {
        for (const clone of DynamicBody.clones) {
            clone.updateClone()
        }
    }
}