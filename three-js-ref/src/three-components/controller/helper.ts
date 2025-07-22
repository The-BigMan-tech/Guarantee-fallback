export function getGroundDetectionDistance(height:number):number {
    return (height/2) + 0.5 + ( (height %2 ) * 0.5)//this formula wasnt just decided,it was designed.i made the formula after trying different values that each worked for given hardcoded heights,saw a pattern and crafted a formula for it
}
export class VelocityCalculationUtils {
    private velocitiesY:number[] = []
    private velBeforeHittingGround:number = 0;

    public getVelJustAboveGround(velocityY:number):number {
        this.velBeforeHittingGround = 0;//the effect of this reset is in the next frame not in the current one since i didnt clear it after setting it
        if (this.velocitiesY.length >= 2) this.velocitiesY.shift();
        const verticalVel = Math.round(velocityY);
        this.velocitiesY.push(verticalVel);
        const firstVel = this.velocitiesY[0];
        const secondVel = this.velocitiesY[1];
        if ((Math.sign(firstVel) == -1) && (secondVel == 0)) {
            this.velBeforeHittingGround = Math.abs(firstVel)
        }
        return this.velBeforeHittingGround;
    }
}