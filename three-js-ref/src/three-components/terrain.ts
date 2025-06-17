import * as THREE from "three"

const terrainGeometry = new THREE.BoxGeometry(1000,5,1000);
const terrainMaterial = new THREE.MeshPhysicalMaterial({ color:0x3f3f3f });
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;