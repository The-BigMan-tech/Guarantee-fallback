import * as THREE from 'three';
import { ambientLight,directionalLight } from './lights';
import { yawObject } from './camera';
import { loadBotModel } from './bot.three';

export const scene = new THREE.Scene();
const gridHelper = new THREE.GridHelper(200,50,0x209de0,0x209de0)
scene.background = new THREE.Color(0xcae3f7); 
scene.add(ambientLight,directionalLight);
scene.add(directionalLight);
scene.add(gridHelper)
scene.add(yawObject);
loadBotModel(scene)


