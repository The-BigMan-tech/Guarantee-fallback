import * as RAPIER from "@dimforge/rapier3d"
import * as THREE from "three";

export function getGroundDetectionDistance(height:number):number {
    return (height/2) + 0.5 + ( (height %2 ) * 0.5)//this formula wasnt just decided,it was designed.i made the formula after trying different values that each worked for given hardcoded heights,saw a pattern and crafted a formula for it
}
export class VelCalcUtils {
    private velocityInAir:number = 0;

    public roundTo3dp(num:number):number {
        return Math.round(num * 1000) / 1000;
    }
    public getRigidBodyDirection(rigidBody:RAPIER.RigidBody):THREE.Vector3 {
        const stepSize = 1; // Adjust this value as needed
        const velocity = new THREE.Vector3().copy(rigidBody.linvel());
        const direction = velocity.normalize().multiplyScalar(stepSize); // Normalize to get the direction
        direction.x = this.roundTo3dp(direction.x);
        direction.y = this.roundTo3dp(direction.y);
        direction.z = this.roundTo3dp(direction.z);
        return direction;
    }

    public getVelJustAboveGround(velocityY:number,isGrounded:boolean):number {
        const verticalVel = Math.round(velocityY);
        let velBeforeHittingGround:number = 0;
        if (!isGrounded) {//we only want to calculate this while airborne
            console.log('Fell velocitiesY:',verticalVel);
            this.velocityInAir = verticalVel
        }else {
            velBeforeHittingGround = Math.abs(this.velocityInAir);
            this.velocityInAir = 0;
        }
        return velBeforeHittingGround
    }
}