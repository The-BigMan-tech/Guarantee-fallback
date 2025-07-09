import * as THREE from 'three';
import { directionalLight } from './lights.three';
import { sky } from './sun.three';
import { player } from './player/player.three';
import { cube } from './terrain.three';
import {cubesGroup } from './tall-cubes.three';
import { entityManager } from './entity-system/entity-manager.three';
import { terrainManager } from './terrain-system/terrain-manager.three';

export const scene = new THREE.Scene();

scene.add(directionalLight);
scene.add(sky);
scene.add(player.char);
scene.add(entityManager.entityGroup);
scene.add(terrainManager.floorGroup);
scene.add(cube)
scene.add(cubesGroup)
scene.fog = new THREE.Fog(0xa5a5a5,30,100)
