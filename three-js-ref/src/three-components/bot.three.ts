import * as THREE from "three"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
const loader = new GLTFLoader();

let bot:THREE.Group | null  = null;
const botClones:THREE.Object3D[] = []

export function loadBotModel(scene:THREE.Scene,onLoaded?: () => void) {
    loader.load('./godotbot-2.glb',
        gltf=>{
            bot = gltf.scene;
            bot.position.y -= 1
            bot.position.x +=5 
            scene.add(bot)
            if (onLoaded) onLoaded();
        }, 
        undefined, 
        error =>console.error( error ),
    );
}
export function animateBot() {
    if (bot) {
        bot.rotation.y -= 0.02;
    }
}
export function spawnBotClone(scene: THREE.Scene, position: THREE.Vector3) {
    if (bot) {
        const newClone = clone(bot);
        newClone.position.copy(position);
        botClones.push(newClone);
        scene.add(newClone);
        return newClone;
    }
    console.warn("Original bot model not loaded yet");
    return null;
}


