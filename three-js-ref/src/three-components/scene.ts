import * as THREE from 'three';
import { loadBotModel} from './bot.three';
import { ambientLight,directionalLight } from './lights';
import { yawObject } from './camera';
// import { cube } from './cube.three';
// import { line } from './line.three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x464849); 
scene.add(ambientLight,directionalLight);
scene.add(directionalLight);
const gridHelper = new THREE.GridHelper(200,50,0x2c84b0,0x2c84b0)
scene.add(gridHelper)
scene.add(yawObject)
// scene.add(cube,line)


loadBotModel(scene,() => {
//ypu can spawn bot clones here after the bot model has been loaded or anything else required
})

