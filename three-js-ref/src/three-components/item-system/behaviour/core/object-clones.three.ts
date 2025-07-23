import { ItemClone } from "./item-clone.three";
import * as THREE from "three";

export class ItemClones {
    public static clones:ItemClone[] = [];//this is for the player to get the looked at clone and dispose its reources when removing it
    public static cloneIndices:Map<ItemClone,number> = new Map();
    public static group:THREE.Group = new THREE.Group();

    public static updateClones() {
        for (const clone of ItemClones.clones) {
            clone.updateClone();
        }
    }
}