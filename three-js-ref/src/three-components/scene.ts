import * as THREE from 'three';
import { directionalLight } from './lights';
import { sky } from './sun';
import { player } from './player/player.three';
import { terrain } from './terrain';
import { cube } from './terrain';
import {cubesGroup } from './tall-cube';

export const scene = new THREE.Scene();
scene.add(directionalLight);
scene.add(sky);
scene.add(player)
scene.add(terrain);
scene.add(cube)
scene.add(cubesGroup)
scene.fog = new THREE.Fog(0xa5a5a5,30,100)
