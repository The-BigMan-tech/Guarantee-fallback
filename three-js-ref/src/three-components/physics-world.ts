import * as RAPIER from '@dimforge/rapier3d'
import { gravityY } from './player/globals';

export const physicsWorld = new RAPIER.World({x:0,y:-gravityY,z:0})
physicsWorld.numSolverIterations = 6;  // default is 4, increase as needed