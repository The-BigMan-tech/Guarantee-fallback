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
loadBotModel(scene)
