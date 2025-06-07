import * as THREE from 'three'
import { camera } from './camera';
import { scene } from './scene';
import animateCube from './cube.three';
import { animateBot } from './bot.three';
import { loadEnv } from './env';
import { animateCamera } from './camera';

export const renderer = new THREE.WebGLRenderer();
export const canvas = renderer.domElement;

loadEnv(scene,renderer)
renderer.setAnimationLoop(()=>{
    animateCube();
    animateBot();
    animateCamera();
    renderer.render( scene, camera );
});
