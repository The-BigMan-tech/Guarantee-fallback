import * as THREE from 'three'
import { camera } from './player/camera';
import { scene } from './scene';
import { loadEnv } from './env';
import { animateCamera} from './player/camera';
import { updateSun } from './sun';
import { animatePlayer } from './player/player.three';

export const renderer = new THREE.WebGLRenderer({antialias:true});
export const canvas = renderer.domElement;

loadEnv(scene,renderer)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setAnimationLoop(()=>{      
    animateCamera();
    animatePlayer();
    updateSun();
    renderer.render( scene, camera );
});
