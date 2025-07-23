export function getGroundDetectionDistance(height:number):number {
    return (height/2) + 0.5 + ( (height %2 ) * 0.5)//this formula wasnt just decided,it was designed.i made the formula after trying different values that each worked for given hardcoded heights,saw a pattern and crafted a formula for it
}
export class VelCalcUtils {
    private velocityInAir:number = 0;

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