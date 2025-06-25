import * as THREE from 'three';
import { directionalLight } from './lights.three';
import { sky } from './sun.three';
import { player } from './player/player.three';
import { terrain } from './terrain.three';
import { cube } from './terrain.three';
import {cubesGroup } from './tall-cubes.three';
import { entity } from './entity/entity.three';

export const scene = new THREE.Scene();
scene.add(directionalLight);
scene.add(sky);
scene.add(player.characterController);
scene.add(entity.characterController);
scene.add(terrain);
scene.add(cube)
scene.add(cubesGroup)
scene.fog = new THREE.Fog(0xa5a5a5,30,100)
