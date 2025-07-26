import { RigidBodyClone } from "./rigidbody-clone.three";
import * as THREE from "three";

export class RigidBodyClones {
    public static clones:RigidBodyClone[] = [];//this is for the player to get the looked at clone and dispose its reources when removing it
    public static cloneIndices:Map<RigidBodyClone,number> = new Map();
    public static group:THREE.Group = new THREE.Group();

    public static updateClones(deltaTime:number) {
        for (const clone of RigidBodyClones.clones) {
            clone.updateClone(deltaTime);
        }
    }
}