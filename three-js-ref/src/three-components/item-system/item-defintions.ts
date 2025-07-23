import * as THREE from "three"
import { DynamicBody } from "./behaviour/dynamic-body.three";
import { Throwable } from "./behaviour/throwable.three";
import type { ItemID,Item } from "./behaviour/core/types";

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
        transformInHand:{
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
            spawnDistance,
            showPlacementHelper:true
        })
    },
    'boulder':{
        name:'Boulder',
        modelPath:modelPaths.Boulder,
        imagePath:'./boulder/boulder.png',
        scene:null,
        transformInHand:{
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
            spawnDistance,
            showPlacementHelper:false
        })
    }
}