import * as THREE from "three"
import { DynamicBody } from "./behaviour/dynamic-body.three";
import { Throwable } from "./behaviour/throwable.three";
import type { ItemBody } from "./behaviour/core/types";

export interface ItemBehaviour {
    use:(view:THREE.Group,itemID:string,userStrength:number)=>void,
    itemBody?:ItemBody//not all item behaviours will need to be placed in the world like a sword
}
export type ItemID = string;

export interface ItemTransform {
    position:THREE.Vector3,
    rotation:THREE.Euler,
    scale:THREE.Vector3
}

export interface Item {
    readonly name: string,          // friendly name
    readonly modelPath: string,   // path to model file
    readonly imagePath: string,    // path to model file
    scene:THREE.Group | null,//holds a ref to the gltf model
    transform:ItemTransform,
    behaviour:ItemBehaviour
}
function eulerDegToRad(euler: THREE.Euler): THREE.Euler {
    return new THREE.Euler(
        THREE.MathUtils.degToRad(euler.x),
        THREE.MathUtils.degToRad(euler.y),
        THREE.MathUtils.degToRad(euler.z),
        euler.order // preserve the order
    );
}
const modelPaths = {//this is to prevent duplication
    Block:'./block/block.glb',
    Boulder:'./boulder/boulder.glb',
}

export const spawnDistance = 5;
export const itemDefinitions:Record<ItemID,Item>  = {//items should be registered on startup and shouldn be mutated
    'block':{
        name:'Block',
        modelPath:modelPaths.Block,
        imagePath:'./block/block.png',
        scene:null,
        transform:{//this is how it looks when holding the item
            position:new THREE.Vector3(0,-0.3,0), 
            rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
            scale:new THREE.Vector3(0.2,0.2,0.2)
        },
        behaviour:new DynamicBody({
            modelPath:modelPaths.Block,
            density:3,
            width:2,
            height:2,
            depth:2,
            durability:10,
            spawnDistance
        })
    },
    'boulder':{
        name:'Boulder',
        modelPath:modelPaths.Boulder,
        imagePath:'./boulder/boulder.png',
        scene:null,
        transform:{
            position:new THREE.Vector3(0,-0.3,0), 
            rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
            scale:new THREE.Vector3(0.3,0.3,0.3)
        },
        behaviour:new Throwable({
            modelPath:modelPaths.Boulder,
            density:2,
            width:2,
            height:2,
            depth:2,
            durability:10,
            spawnDistance
        })
    }
}