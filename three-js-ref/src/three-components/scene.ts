import * as THREE from 'three';
import { directionalLight } from './lights';
import { sky } from './sun';
import { player } from './player/player.three';
import { terrain } from './terrain';
import { cube } from './terrain';

export const scene = new THREE.Scene();
scene.add(directionalLight);
scene.add(sky);
scene.add(player)
scene.add(terrain);
scene.add(cube)
scene.fog = new THREE.Fog(0xa5a5a5,30,100)

const gridSize = 1000
const gridHelper = new THREE.GridHelper(gridSize,50,0x000000,0x000000);
gridHelper.position.y = 0.5
scene.add(gridHelper)
