import * as THREE from 'three'
import { EdgesGeometry, LineSegments, LineBasicMaterial } from 'three';
import { physicsWorld } from './physics-world.three';
import * as RAPIER from '@dimforge/rapier3d'
import PoissonDiskSampling from 'poisson-disk-sampling';
import { startingLevelY } from './physics-world.three';

const groundArea = 800; // max range for distribution on XZ plane
const minDistance = 40; // minimum distance between points (adjust to cube size)

const pds = new PoissonDiskSampling({
    shape: [groundArea,groundArea], // width and depth of sampling area
    minDistance: minDistance,
    tries: 10
});
const points = pds.fill(); // array of [x, z] points

export const cubesGroup = new THREE.Object3D();

const tallCubeMaterial = new THREE.MeshPhysicalMaterial({ color:0x4f4f4f});
const minHeight = 7;
const maxHeight = 7;

for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];

    const height = minHeight + (Math.random() * (maxHeight - minHeight));
    const posY = height / 2 + startingLevelY;//to make it stand on the startinglevl not that half of it is above and another half above
    const posX = x - groundArea/2; // center around zero.divide by two to align it around the ground's origin to prevent leakage from the ground
    const posZ = z - groundArea/2;

    const tallCubeGeometry = new THREE.BoxGeometry(20,height,20);
    const tallCube = new THREE.Mesh(tallCubeGeometry, tallCubeMaterial);
    const tallCubeEdges = new EdgesGeometry(tallCubeGeometry);
    const tallCubeLine = new LineSegments(tallCubeEdges, new LineBasicMaterial({ color: 0x000000 }));
    tallCube.add(tallCubeLine)

    const tallCubeCollider = RAPIER.ColliderDesc.cuboid(10,height/2,10);
    tallCubeCollider.setFriction(0.5)
    const tallCubeBody = RAPIER.RigidBodyDesc.fixed();
    const tallCubeRigidBody = physicsWorld.createRigidBody(tallCubeBody);
    physicsWorld.createCollider(tallCubeCollider,tallCubeRigidBody);

    tallCubeRigidBody.setTranslation({x:posX,y:posY,z:posZ},true)
    tallCube.position.set(tallCubeRigidBody.translation().x,tallCubeRigidBody.translation().y,tallCubeRigidBody.translation().z)
    cubesGroup.add(tallCube);
}
