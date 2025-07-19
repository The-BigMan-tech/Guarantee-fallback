import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"

interface DynamicBodyData {
    modelPath:string,
    width:number,
    height:number,
    depth:number
}
export class DynamicBody implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public static dynamicBodyGroup:THREE.Group = new THREE.Group()

    private data:DynamicBodyData;
    private model:THREE.Group | null = null;

    constructor(data:DynamicBodyData) {
        this.data = data;
        DynamicBody.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use() {
        if (this.model) {
            DynamicBody.dynamicBodyGroup.add(this.model.clone(true));
            console.log('model has loaded');
        }
    }
}