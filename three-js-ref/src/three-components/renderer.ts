import * as THREE from 'three'
import { camera, renderKeyEvents } from './player/camera';
import { scene } from './scene';
import { loadEnv } from './env';
import { animateCamera} from './player/camera';
import { updateSun } from './sun';

export const renderer = new THREE.WebGLRenderer();
export const canvas = renderer.domElement;

loadEnv(scene,renderer)

renderer.setAnimationLoop(()=>{      
    animateCamera();
    renderKeyEvents();
    updateSun();
    renderer.render( scene, camera );
});
