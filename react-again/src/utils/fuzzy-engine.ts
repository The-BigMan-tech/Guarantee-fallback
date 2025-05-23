import {distance} from "fastest-levenshtein"
import fuzzysort from 'fuzzysort'
import { roundToTwo,normalizeString } from "./quarks.ts";

function calcDistanceScore(query:string,str:string,minThreshold:number):number {
    const stringDistance:number = distance(query,str);
    const maxLen = Math.max(query.length, str.length);
    if (maxLen === 0) return 100; // both strings empty
    const similarity = 1 - (stringDistance / maxLen);
    const rawScore = roundToTwo(similarity * 100);
    let adjustedScore = Math.max(0, rawScore - minThreshold);
    if (adjustedScore > 0) {//what i did here is that i didnt want to tolerate low matches.without the -35,license.txt will match space but with it space_mono will only match space by 15% when it should be 50% so what i did,was that the prev adjusted value was just used to remove typo big results by taking them to zero,after that the ones that passed will have the min threshold which is 35 added back to them again to get their desreved score
        adjustedScore += minThreshold
    }
    return adjustedScore
}
function getNumWindows(minThreshold: number): number {
    const windowNum = Math.ceil(1/(minThreshold/100))//20 will give 5 windows
    return Math.min(Math.max(windowNum, 1),8);
}  
export function getMatchScore(query:string,str:string,minThreshold:number):number {
    const normalizedStr:string = normalizeString(str);//normalize the query and string to prevent irrelavant mistakes make a difference
    const normalizedQuery:string = normalizeString(query);
    const strLen = normalizedStr.length;
    const queryLen = normalizedQuery.length;
    //Distance match and target padding to eliminate false positives.
    const paddingScale = Math.floor(Math.min(0.75 * minThreshold,25))//20 will scale the padding to 15,30 will take it .flooring will remove floats and prevent it from growing by 1 unit for decimals
    const fullDistanceScore = calcDistanceScore(normalizedQuery,normalizedStr.padEnd(paddingScale,'0'),minThreshold);

    //Subsequence match
    const subsequenceResult = fuzzysort.single(normalizedQuery,normalizedStr)//used subsequence matching from fuzzysort to get good scores for a query where the distance algorithm would have missed just because of distance
    const subsequenceScore = roundToTwo((subsequenceResult?.score || 0) * 100);
    const lengthRatio = queryLen / strLen; // value between 0 and 1
    const scaledSubsequenceScore = roundToTwo(subsequenceScore * lengthRatio * (minThreshold/100));//this is to prevent the subsequence from being too generous for extremely long targets

    //Window slicing
    const numWindows = getNumWindows(minThreshold);
    const windowLength = Math.max(queryLen, Math.floor(strLen / numWindows));
    const slicePoints = [];
    for (let i = 0; i < numWindows; i++) {
        const start = Math.floor(i * (strLen - windowLength) / (numWindows - 1));// Evenly spaced start points
        slicePoints.push(start);
    }
    const sliceScores:number[] = [];

    for (const start of slicePoints) {
        const clampedStart = Math.max(0, Math.min(start, strLen - windowLength));//to ensure the start is at a valid index
        const window = normalizedStr.slice(clampedStart,clampedStart + windowLength).padEnd(windowLength, '0')

        //calculating the distance and deducting the penalty
        const sliceScore = calcDistanceScore(normalizedQuery,window,minThreshold/queryLen);
         //long string diff penalty
        let penalty = 0; 
        if (queryLen < (strLen/4)) {//only adds a penalty if the query is less than quarter of the target length
            const penaltyScale = 0.05 * minThreshold;//will give 1 if minThreshold = 20.at 100,penalty scale will be 5
            const lengthDifference = Math.abs(strLen - queryLen);
            const penaltyCap = minThreshold/2//made the penalty directly proportional to the threshold.if its 20,penalty cap will be 10.100 will give a 50 penalty cap.super strict
            penalty = Math.min(lengthDifference * penaltyScale,penaltyCap);//limits the penalty to 10 and scales the penalty to 0.5 for every length difference.i used 0.5 to smooth out the penalty curve
        }
        sliceScores.push(sliceScore - penalty);//deducts the penalty from the slice score
    };
    const maxSliceScore = Math.max(...sliceScores);
    console.log(fullDistanceScore,Math.max(0,maxSliceScore),scaledSubsequenceScore);
    return Math.max(fullDistanceScore,Math.max(0,maxSliceScore),scaledSubsequenceScore);
}
const scores2 = getMatchScore("py","fileSharpye-sever",30);
console.log("Similarity 2:",scores2);