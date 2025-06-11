/* eslint-disable @typescript-eslint/no-unused-vars */
import * as RAPIER from '@dimforge/rapier3d'

const gravity:RAPIER.Vector = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

const example1 = RAPIER.RigidBodyDesc.fixed();
const example2 = RAPIER.RigidBodyDesc.dynamic();
const example3 = RAPIER.RigidBodyDesc.kinematicVelocityBased();

const rigidBody1 = world.createRigidBody(example1);
const rigidBody2 = world.createRigidBody(example2);
const rigidBody3 = world.createRigidBody(example3);