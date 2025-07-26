import * as THREE from 'three'
import { scene } from './scene.three';
import { loadEnv } from './env.three';
import { updateSun } from './sun.three';
import { physicsWorld } from './physics-world.three';
import { player } from './player/player.three';
import { entityManager } from './entity-system/entity-manager.three';
import { terrainManager } from './terrain-system/terrain-manager.three';
import { relationshipManager } from './entity-system/relationships.three';
import { RigidBodyClones } from './item-system/behaviour/core/rigidbody-clones.three';


export const renderer = new THREE.WebGLRenderer({antialias:true});//play with this
export const canvas = renderer.domElement;
const clock = new THREE.Clock();
loadEnv(scene,renderer)

renderer.shadowMap.enabled = true
renderer.setPixelRatio(window.devicePixelRatio)

renderer.setAnimationLoop(()=>{   
    physicsWorld.step()//a must to be called first
    const deltaTime = clock.getDelta()
    relationshipManager.periodicRelationshipCleanup(deltaTime);
    relationshipManager.refreshRelationships(player);
    player.updateController(deltaTime);
    terrainManager.updateTerrain();
    entityManager.updateAllEntities(deltaTime);
    RigidBodyClones.updateClones(deltaTime);
    updateSun();
    renderer.render( scene,player.camera.cam);//a must to be called last
});
