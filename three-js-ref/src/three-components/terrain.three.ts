import * as THREE from "three"
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld,groundLevelY, startingLevelY } from "./physics-world.three";
import { EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';





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


