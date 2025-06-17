import * as THREE from "three"
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld } from "./physics-world";

const terrainGeometry = new THREE.BoxGeometry(1000,5,1000);
const terrainMaterial = new THREE.MeshPhysicalMaterial({ color:0x3f3f3f });
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;

const groundCollider = RAPIER.ColliderDesc.cuboid(500,2.5,500);
const groundBody = RAPIER.RigidBodyDesc.fixed();
const groundRigidBody = physicsWorld.createRigidBody(groundBody);
physicsWorld.createCollider(groundCollider,groundRigidBody);