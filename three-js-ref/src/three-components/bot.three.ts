import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();

let bot:THREE.Group | null  = null;

export function loadBotModel(group:THREE.Scene | THREE.Object3D) {
    loader.load('./godotbot-2.glb',
        gltf=>{
            bot = gltf.scene;
            bot.position.y = 1
            group.add(bot)
        }, 
        undefined, 
        error =>console.error( error ),
    );
}
