import * as THREE from "three"
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "./physics-world";
import { EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { groundLevelY, startingLevelY } from "./player/globals";

//Flat-terrain with grid
const groundHeight = 1
const groundPosY = groundHeight/2 + groundLevelY;//to fix the situation where half of it is above and half is below the specfied ground level

const gridSize = 1000
const gridHelper = new THREE.GridHelper(gridSize,50,0x000000,0x000000);

const terrainGeometry = new THREE.BoxGeometry(1000,groundHeight,1000);
const terrainMaterial = new THREE.MeshPhysicalMaterial({ color:0x2b2a33 });
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;
terrain.add(gridHelper)

const groundCollider = RAPIER.ColliderDesc.cuboid(500,groundHeight/2,500);
const groundBody = RAPIER.RigidBodyDesc.fixed();
const groundRigidBody = physicsWorld.createRigidBody(groundBody);
physicsWorld.createCollider(groundCollider,groundRigidBody);

groundRigidBody.setTranslation({x:0,y:groundPosY,z:0},true);
terrain.position.set(groundRigidBody.translation().x,groundRigidBody.translation().y,groundRigidBody.translation().z)
gridHelper.position.y += 0.5


//A cuboid
const cubeHeight = 2;
const cubePosY = cubeHeight/2 + startingLevelY;

const cubeGeometry = new THREE.BoxGeometry(20,cubeHeight,20);
const cubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x756a5a });
export const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

const edges = new EdgesGeometry(cubeGeometry);
const line = new LineSegments(edges, new LineBasicMaterial({ color: 0x000000 }));
line.position.copy(cube.position);
line.quaternion.copy(cube.quaternion);
cube.add(line)

export const cubeCollider = RAPIER.ColliderDesc.cuboid(10,cubeHeight/2,10);
cubeCollider.setRestitution(0)
cubeCollider.setFriction(0.4)
const cubeBody = RAPIER.RigidBodyDesc.fixed();
const cubeRigidBody = physicsWorld.createRigidBody(cubeBody);
physicsWorld.createCollider(cubeCollider,cubeRigidBody);

cubeRigidBody.setTranslation({x:0,y:cubePosY,z:0},true)
cube.position.set(cubeRigidBody.translation().x,cubeRigidBody.translation().y,cubeRigidBody.translation().z)


