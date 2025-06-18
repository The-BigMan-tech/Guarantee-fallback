import * as THREE from "three"
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "./physics-world";

const terrainGeometry = new THREE.BoxGeometry(1000,1,1000);
const terrainMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;

const groundCollider = RAPIER.ColliderDesc.cuboid(500,0.5,500);
const groundBody = RAPIER.RigidBodyDesc.fixed();
const groundRigidBody = physicsWorld.createRigidBody(groundBody);
physicsWorld.createCollider(groundCollider,groundRigidBody);

const cubeGeometry = new THREE.BoxGeometry(2,2,2);
const cubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x3f3f3f });
export const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

const cubeCollider = RAPIER.ColliderDesc.cuboid(1,1,1);
const cubeBody = RAPIER.RigidBodyDesc.fixed();
const cubeRigidBody = physicsWorld.createRigidBody(cubeBody);
physicsWorld.createCollider(cubeCollider,cubeRigidBody);

cubeRigidBody.setTranslation({x:0,y:1,z:-10},true)
cube.position.set(cubeRigidBody.translation().x,cubeRigidBody.translation().y,cubeRigidBody.translation().z)