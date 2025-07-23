import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";


//these methods are to create line geometries for their respective shapes.they are used to visualize hitboxes for visual debugging
export function createCapsuleLine(radius:number,halfHeight:number) {
    const charGeometry = new THREE.CapsuleGeometry(radius,halfHeight*2);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}

export function createBoxLine(width:number,height:number,depth:number) {
    const charGeometry = new THREE.BoxGeometry(width,height,depth);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}
export function rotateBy180():THREE.Quaternion {
    const targetRotation:THREE.Vector3 = new THREE.Vector3().setY(1);
    return new THREE.Quaternion().setFromAxisAngle(targetRotation,degToRad(180));
}
export const placementHelper:THREE.Group = new THREE.Group();