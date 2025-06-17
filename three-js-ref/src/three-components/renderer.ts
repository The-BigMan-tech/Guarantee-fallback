import * as THREE from 'three'
import { camera } from './player/camera';
import { scene } from './scene';
import { loadEnv } from './env';
import { animateCamera} from './player/camera';
import { updateSun } from './sun';
import { animatePlayer } from './player/player.three';
import { physicsWorld } from './physics-world';

export const renderer = new THREE.WebGLRenderer({antialias:false});
export const canvas = renderer.domElement;

loadEnv(scene,renderer)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setAnimationLoop(()=>{   
    physicsWorld.step()   
    animateCamera();
    animatePlayer();
    updateSun();
    renderer.render( scene, camera );
});
