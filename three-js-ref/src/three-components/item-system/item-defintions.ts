import * as THREE from "three"
import { DynamicBody } from "./behaviour/dynamic-body.three";
import { Throwable } from "./behaviour/throwable.three";
import { Camera } from "../camera/camera.three";

export interface ItemBehaviour {
    use:(customCamera:Camera)=>void
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
    Snowball:'./snowball/snowball.glb',
}
export const itemDefinitions:Record<ItemID,Item>  = {//items should be registered on startup and shouldn be mutated
    'block':{
        name:'Block',
        modelPath:modelPaths.Block,
        imagePath:'./block/block.png',
        scene:null,
        transform:{
            position:new THREE.Vector3(0,-0.3,0), 
            rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
            scale:new THREE.Vector3(0.2,0.2,0.2)
        },
        behaviour:new DynamicBody({
            modelPath:modelPaths.Block,
            mass:30,
            width:2,
            height:2,
            depth:2
        })
    },
    'snowball':{
        name:'Snowball',
        modelPath:modelPaths.Snowball,
        imagePath:'./snowball/snowball.png',
        scene:null,
        transform:{
            position:new THREE.Vector3(0,-0.3,0), 
            rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
            scale:new THREE.Vector3(0.3,0.3,0.3)
        },
        behaviour:new Throwable()
    }
}