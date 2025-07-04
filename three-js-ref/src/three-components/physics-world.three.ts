import * as RAPIER from '@dimforge/rapier3d'

export const gravityY:Readonly<number> = 40
export const groundLevelY:Readonly<number>  = -1;//if it stands on -1,then all the objects will stand on 0 given that the ground height is 1.this makes it easier to know the cord we are standing on by just checking the height of the object
export const startingLevelY:Readonly<number>  = 0;
export const outOfBoundsY:Readonly<number>  = -60
export const physicsWorld = new RAPIER.World({x:0,y:-gravityY,z:0});
export const combatCooldown = 0.3//sync attack and knockback cooldowns
physicsWorld.numSolverIterations = 10;  // default is 4, increase as needed