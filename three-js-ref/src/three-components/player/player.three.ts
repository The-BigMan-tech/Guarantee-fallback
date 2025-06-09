import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { yawObject } from "./camera";
const loader = new GLTFLoader();

export const player = new THREE.Group();
const modelPath:string = './godotbot-2.glb';
loader.load(modelPath,
    gltf=>{
        const playerModel = gltf.scene;
        player.add(playerModel);
        player.add(yawObject)
    },undefined, 
    error =>console.error( error ),
);
