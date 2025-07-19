import * as THREE from 'three';
import { directionalLight } from './lights.three';
import { sky } from './sun.three';
import { player } from './player/player.three';
import { entityManager } from './entity-system/entity-manager.three';
import { terrainManager } from './terrain-system/terrain-manager.three';
import { DynamicBody } from './item-system/behaviour/dynamic-body.three';

export const scene = new THREE.Scene();

scene.add(directionalLight);
scene.add(sky);
scene.add(player.char,player.points);
scene.add(entityManager.entityGroup);
scene.add(terrainManager.floorGroup);
scene.add(DynamicBody.dynamicBodyGroup)
scene.fog = new THREE.Fog(0xa5a5a5,30,100)
