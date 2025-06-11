import * as THREE from "three"

const terrainGeometry = new THREE.BoxGeometry(1000, 1000,5);
const terrainMaterial = new THREE.MeshPhysicalMaterial({ color:0x3f3f3f });
terrainGeometry.rotateX(-Math.PI / 2);
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;