import * as THREE from 'three';
import { cube } from './cube.three';
import { line } from './line.three';
import { loadBotModel} from './bot.three';
import { ambientLight,directionalLight } from './lights';

export const scene = new THREE.Scene();
scene.add(ambientLight);
scene.add(directionalLight);
scene.add(cube)
scene.add(line)

loadBotModel(scene,() => {
//ypu can spawn bot clones here after the bot model has been loaded or anything else required
})

