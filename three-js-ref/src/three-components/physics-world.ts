import * as RAPIER from '@dimforge/rapier3d'

export const physicsWorld = new RAPIER.World({x:0,y:-9.8,z:0})

const groundCollider = RAPIER.ColliderDesc.cuboid(500,2.5,500);
const groundBody = RAPIER.RigidBodyDesc.fixed();
const groundRigidBody = physicsWorld.createRigidBody(groundBody);
physicsWorld.createCollider(groundCollider,groundRigidBody);

