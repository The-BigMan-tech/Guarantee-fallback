import { Controller } from "../controller/controller.three";
import type { FixedControllerData,DynamicControllerData } from "../controller/controller.three";
import * as THREE from "three"
import { physicsWorld } from "../physics-world.three";
import { disposeHierarchy } from "../disposer/disposer.three";

export class Block extends Controller {
    private blockGroup:THREE.Group;

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,blockGroup:THREE.Group) {
        super(fixedData,dynamicData);
        this.blockGroup = blockGroup
    }
    public cleanUp() {
        this.blockGroup.remove(this.char);
        disposeHierarchy(this.char);
        if (this.characterRigidBody) {
            physicsWorld.removeRigidBody(this.characterRigidBody)
            this.characterRigidBody = null
        }
    }
    protected onLoop(): void {
        //empty for now cuz it will start of as static
    }
}