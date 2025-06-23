import * as THREE from 'three'
import { scene } from './scene.three';
import { loadEnv } from './env.three';
import { updateSun } from './sun.three';
import { physicsWorld } from './physics-world.three';
import { player } from './player/player.three';

export const renderer = new THREE.WebGLRenderer({antialias:true});//play with this
export const canvas = renderer.domElement;

loadEnv(scene,renderer)
renderer.shadowMap.enabled = true
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setAnimationLoop(()=>{   
    physicsWorld.step()//a must to be called first
    player.updateCharacter()
    updateSun();
    renderer.render( scene,player.camera.cam);//a must to be called last
    player.clearPoints()
});
