export function getGroundDetectionDistance(height:number):number {
    return (height/2) + 0.5 + ( (height %2 ) * 0.5)//this formula wasnt just decided,it was designed.i made the formula after trying different values that each worked for given hardcoded heights,saw a pattern and crafted a formula for it
}