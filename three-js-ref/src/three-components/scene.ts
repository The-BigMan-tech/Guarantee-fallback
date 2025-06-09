import * as THREE from 'three';
import { directionalLight } from './lights';
import { sky } from './sun';
import { player } from './player/player.three';

export const scene = new THREE.Scene();
scene.add(directionalLight);
scene.add(sky);
scene.add(player)


const terrainGeometry = new THREE.PlaneGeometry(1000, 1000);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
terrainGeometry.rotateX(-Math.PI / 2);
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;

scene.add(terrain);



