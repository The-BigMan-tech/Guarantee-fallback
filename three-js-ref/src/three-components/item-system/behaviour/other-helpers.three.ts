import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";


//these methods are to create line geometries for their respective shapes.they are used to visualize hitboxes for visual debugging
export function createCapsuleLine(radius:number,halfHeight:number) {
    const capsuleGeometry = new THREE.CapsuleGeometry(radius,halfHeight*2);
    const capsuleEdges = new THREE.EdgesGeometry(capsuleGeometry);
    return new THREE.LineSegments(capsuleEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}


const lineMat = new THREE.LineBasicMaterial({ color: 0x000000 });
export function createBoxLine(width:number,height:number,depth:number) {
    const boxGeometry = new THREE.BoxGeometry(width,height,depth);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    return new THREE.LineSegments(boxEdges,lineMat);
}

export function rotateBy180X():THREE.Quaternion {
    const targetRotation:THREE.Vector3 = new THREE.Vector3().setY(1);
    return new THREE.Quaternion().setFromAxisAngle(targetRotation,degToRad(180));
}
export function rotateBy180Y():THREE.Quaternion {
    const targetRotation:THREE.Vector3 = new THREE.Vector3().setX(1);
    return new THREE.Quaternion().setFromAxisAngle(targetRotation,degToRad(180));
}
export function invertVerticalRotation():THREE.Quaternion {
    const targetRotation:THREE.Vector3 = new THREE.Vector3().setY(1);
    return new THREE.Quaternion().setFromAxisAngle(targetRotation,degToRad(90));
}

export const placementHelper:THREE.Group = new THREE.Group();