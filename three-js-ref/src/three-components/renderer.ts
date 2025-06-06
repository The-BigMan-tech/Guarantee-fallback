import * as THREE from 'three'
import { camera } from './camera';
import { scene } from './scene';
import animateCube from './cube.three';

export const renderer = new THREE.WebGLRenderer();
export const canvas = renderer.domElement;

renderer.setAnimationLoop(()=>{
    animateCube()
    renderer.render( scene, camera );
});