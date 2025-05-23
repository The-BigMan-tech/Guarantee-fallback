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
export function getMatchScore(query:string,str:string,minThreshold:number):number {
    const normalizedStr:string = normalizeString(str);//normalize the query and string to prevent irrelavant mistakes make a difference
    const normalizedQuery:string = normalizeString(query);
    const strLen = normalizedStr.length;
    const queryLen = normalizedQuery.length;
    //Distance match and target padding to eliminate false positives.
    const fullDistanceScore = calcDistanceScore(normalizedQuery,normalizedStr.padEnd(15,'0'),minThreshold);

    //Subsequence match
    const subsequenceResult = fuzzysort.single(normalizedQuery,normalizedStr)//used subsequence matching from fuzzysort to get good scores for a query where the distance algorithm would have missed just because of distance
    const subsequenceScore = roundToTwo((subsequenceResult?.score || 0) * 100);
    const lengthRatio = queryLen / strLen; // value between 0 and 1
    const scaledSubsequenceScore = roundToTwo(subsequenceScore * lengthRatio);//this is to prevent the subsequence from being too generous for extremely long targets

    //Window slicing
    const targetSliceLength = Math.max(queryLen, Math.floor(strLen / 3));//the length of the window from the start must be 1/3 of the target string or the query length if the fraction of the length is too small
    const slicePoints = [0,Math.floor((strLen - targetSliceLength) / 2),strLen - targetSliceLength];//window into the beginning,middle and end of the target string
    const sliceScores:number[] = [];

    for (const start of slicePoints) {
        const clampedStart = Math.max(0, Math.min(start, strLen - targetSliceLength));//to ensure the start is at a valid index
        const windowWidth = clampedStart + targetSliceLength
        const window = normalizedStr.slice(clampedStart,windowWidth).padEnd(targetSliceLength, '0')

        //calculating the distance and deducting the penalty
        const sliceScore = calcDistanceScore(normalizedQuery,window,minThreshold/queryLen);
        console.log("window; ",window);
         //long string diff penalty
        let penalty = 0; 
        if (queryLen < (strLen/4)) {//only adds a penalty if the query is less than quarter of the target length
            const penaltyScale = 0.05 * minThreshold;//will give 0.5 if minThreshold = 20.at 100,penalty scale will be 2.5
            const lengthDifference = Math.abs(strLen - queryLen);
            penalty = Math.min(lengthDifference * penaltyScale, 15);//limits the penalty to 10 and scales the penalty to 0.5 for every length difference.i used 0.5 to smooth out the penalty curve
        }
        sliceScores.push(sliceScore - penalty);//deducts the penalty from the slice score
    };
    const maxSliceScore = Math.max(...sliceScores);
    console.log(fullDistanceScore,Math.max(0,maxSliceScore),scaledSubsequenceScore);
    return Math.max(fullDistanceScore,Math.max(0,maxSliceScore),scaledSubsequenceScore);
}
const scores = getMatchScore("pysma","prisma-ref",20);
console.log("Similarity 1:",scores);

const scores2 = getMatchScore("py","prisma-ref",20);
console.log("Similarity 2:",scores2);