import * as THREE from 'three';
import { directionalLight } from './lights';
import { sky } from './sun';
import { player } from './player/player.three';
import { loadBotModel } from './bot.three';
import { terrain } from './terrain';

export const scene = new THREE.Scene();
scene.add(directionalLight);
scene.add(sky);
scene.add(player)
scene.add(terrain);
scene.fog = new THREE.Fog(0xa5a5a5,30,200)
loadBotModel(scene);

const gridSize = 1000
const gridHelper = new THREE.GridHelper(gridSize,200,0x787878,0x787878);
gridHelper.position.y = 3
scene.add(gridHelper)
