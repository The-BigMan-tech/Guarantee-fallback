import * as THREE from "three"

const terrainGeometry = new THREE.PlaneGeometry(1000, 1000);
const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
terrainGeometry.rotateX(-Math.PI / 2);
export const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;