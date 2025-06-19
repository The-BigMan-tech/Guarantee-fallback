import * as RAPIER from '@dimforge/rapier3d'

export const physicsWorld = new RAPIER.World({x:0,y:-40,z:0})
physicsWorld.numSolverIterations = 10;  // default is 4, increase as needed