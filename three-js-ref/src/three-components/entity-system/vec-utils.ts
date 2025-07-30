import * as THREE from "three";
import { radToDeg } from "three/src/math/MathUtils.js";
import type { degrees } from "./global-types";

export class EntityVecUtils {
    public static distanceXZ(a: THREE.Vector3Like, b: THREE.Vector3Like): number {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt((dx * dx) + (dz * dz));
    }
    public static getDirToTarget(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3) {
        const dirToTarget = new THREE.Vector3().subVectors(targetPos,srcPos).normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(srcQuat).normalize();
        return {forward,dirToTarget}
    }
    public static getVerticalAngleDiff(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):degrees {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(srcQuat).normalize();
        const dirToTarget = new THREE.Vector3().subVectors(targetPos, srcPos).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);

        const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
        const dirOnVerticalPlane = dirToTarget.clone().sub(right.clone().multiplyScalar(dirToTarget.dot(right))).normalize();
        let angle = forward.angleTo(dirOnVerticalPlane); // radians, 0 to PI

        const cross = new THREE.Vector3().crossVectors(forward, dirOnVerticalPlane);
        const sign = Math.sign(cross.dot(right)); // positive means target is above forward vector
        angle = angle * sign;

        return Math.round(radToDeg(angle));
    }
    public static isFacingTargetXZ(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):boolean {
        const {forward,dirToTarget} = EntityVecUtils.getDirToTarget(srcPos,srcQuat,targetPos)
        const flatForward = forward.clone().setY(0).normalize();
        const flatDirToTarget = dirToTarget.clone().setY(0).normalize();

        const dot = flatForward.dot(flatDirToTarget)
        const angle = Math.acos(dot); // angle in radians.it ranges from -1 to 1
        const facingThreshold = THREE.MathUtils.degToRad(15); // e.g., 15 degrees
        const isFacingTarget = angle < facingThreshold;

        return isFacingTarget
    }
    public static getRequiredQuat(srcPos:THREE.Vector3,srcQuat:THREE.Quaternion,targetPos:THREE.Vector3):THREE.Quaternion {
        const {forward,dirToTarget} = EntityVecUtils.getDirToTarget(srcPos,srcQuat,targetPos)
        return new THREE.Quaternion().setFromUnitVectors(forward, dirToTarget);
    }   
    //it gets the velocity that an object must have to be thrown from a src pos to a target with a given throw angle
    public static getThrowVelocity(srcPos:THREE.Vector3,targetPos:THREE.Vector3,angleRad:number) {
        const gravity = 9.8; // or your gravity constant
        const theta = angleRad
        const dist = this.distanceXZ(srcPos,targetPos)   // horizontal distance to target
        const heightDiff = targetPos.y - srcPos.y; // vertical height difference

        const denominator = 2 * Math.pow(Math.cos(theta), 2) * ( (dist * Math.tan(theta)) - heightDiff);
        const initialVelocity = Math.sqrt((gravity * dist * dist) / denominator);
        return initialVelocity;
    } 
}