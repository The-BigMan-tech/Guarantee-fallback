import * as THREE from 'three'
import { camera, renderKeyEvents } from './camera';
import { scene } from './scene';
import { loadEnv } from './env';
import { animateCamera} from './camera';

export const renderer = new THREE.WebGLRenderer();
export const canvas = renderer.domElement;

loadEnv(scene,renderer)

renderer.setAnimationLoop(()=>{      
    animateCamera();
    renderKeyEvents()
    renderer.render( scene, camera );
});
