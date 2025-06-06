import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PMREMGenerator } from 'three';

export function loadEnv(scene:THREE.Scene,renderer: THREE.WebGLRenderer) {
    const pmremGenerator = new PMREMGenerator(renderer);
    const env = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
}
