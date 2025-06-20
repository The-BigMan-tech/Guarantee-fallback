import * as THREE from 'three'
import { camera } from './player/camera.three';
import { scene } from './scene.three';
import { loadEnv } from './env.three';
import { updateCamera} from './player/camera.three';
import { updateSun } from './sun.three';
import { updatePlayer } from './player/player.three';
import { physicsWorld } from './physics-world.three';

export const renderer = new THREE.WebGLRenderer({antialias:true});//play with this
export const canvas = renderer.domElement;

loadEnv(scene,renderer)
renderer.shadowMap.enabled = true
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setAnimationLoop(()=>{   
    physicsWorld.step()   
    updateCamera();
    updatePlayer();
    updateSun();
    renderer.render( scene, camera );
});
