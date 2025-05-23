import {distance} from "fastest-levenshtein"
import fuzzysort from 'fuzzysort'
import { roundToTwo,normalizeString } from "./quarks.ts";
import { LRUCache } from 'lru-cache'


const LruOptions:LRUCache.Options<string,number,unknown>  = {
    max:500,
    allowStale: false,
}
const fuzzyCache = new LRUCache<string,number>(LruOptions)

function tokenize(str: string): string[] {
    return str.split(' ').filter(Boolean);
}
function sortTokens(str: string): string {
    return tokenize(str).sort().join(' ');
}
function calcDistanceScore(query:string,str:string,minThreshold:number):number {
    const stringDistance:number = distance(query,str);
    const maxLen = Math.max(query.length, str.length);
    if (maxLen === 0) return 100; // both strings empty
    const similarity = 1 - (stringDistance / maxLen);
    const rawScore = roundToTwo(similarity * 100);
    let adjustedScore = Math.max(0, rawScore - minThreshold);//ensures that it doesnt go below 0
    if (adjustedScore > 0) {//what i did here is that i didnt want to tolerate low matches.without the -35,license.txt will match space but with it space_mono will only match space by 15% when it should be 50% so what i did,was that the prev adjusted value was just used to remove typo big results by taking them to zero,after that the ones that passed will have the min threshold which is 35 added back to them again to get their desreved score
        adjustedScore += minThreshold
    }
    return adjustedScore
}
function getNumWindows(minThreshold: number): number {
    const safeDenominator = (minThreshold/100) || (1/8)//defaults to 8 on 0%
    const windowNum = Math.ceil(1/safeDenominator)//20 will give 5 windows
    return Math.min(windowNum,8);//caps the max window number to 8
}  
function getPenalty(queryLen:number,strLen:number,minThreshold:number):number {
    if (queryLen < (strLen/4)) {//only adds a penalty if the query is less than quarter of the target length
        const penaltyScale = 0.05 * minThreshold;//will give 1 if minThreshold = 20.at 100,penalty scale will be 5
        const lengthDifference = Math.abs(strLen - queryLen);
        const penaltyCap = Math.min(minThreshold/2,20)//made the penalty directly proportional to the threshold.if its 20,penalty cap will be 10.capped the penalty to 20 meaning 40+ threshold will give the same cap
        return Math.min(lengthDifference * penaltyScale,penaltyCap);//limits the penalty to 10 and scales the penalty to 0.5 for every length difference.i used 0.5 to smooth out the penalty curve
    }
    return 0
}
export function getMatchScore(query:string,str:string,minThreshold:number):number {
    const cacheKey = `${query}|${str}|${minThreshold}`;
    const cachedResult = fuzzyCache.get(cacheKey);
    if (cachedResult) {//utilize the cache
        return cachedResult;
    }
    const normalizedStr:string = normalizeString(sortTokens(str));//normalize the query and string to prevent irrelavant mistakes make a difference
    const normalizedQuery:string = normalizeString(sortTokens(query));
    const strLen = normalizedStr.length;
    const queryLen = normalizedQuery.length;

    //Distance match and target padding to eliminate false positives.
    const paddingScale = Math.floor(Math.min(0.25 * minThreshold,10))//20 will scale the padding to 15,30 will take it .flooring will remove floats and prevent it from growing by 1 unit for decimals
    const paddedStr = normalizedStr.padEnd(paddingScale,'0')
    const fullDistanceScore = calcDistanceScore(normalizedQuery,paddedStr,minThreshold);

    //Subsequence match
    const subsequenceResult = fuzzysort.single(normalizedQuery,normalizedStr)//used subsequence matching from fuzzysort to get good scores for a query where the distance algorithm would have missed just because of distance
    const subsequenceScore = roundToTwo((subsequenceResult?.score || 0) * 100);
    const lengthRatio = roundToTwo(queryLen / strLen) 
    const subsequenceBonus = (100-minThreshold)/10//20% will have a bonus of 8,100 strictness will give a bonus of 0
    const scaledSubsequenceScore = roundToTwo(Math.min((subsequenceScore * lengthRatio) + subsequenceBonus,100));//this is to prevent the subsequence from being too generous for extremely long targets
    

    //Window slicing.
    const numWindows = getNumWindows(minThreshold);
    const windowLength = Math.max(queryLen, Math.floor(strLen / numWindows));
    const sliceScores:number[] = [];

    for (let i = 0; i < numWindows; i++) {
        const totalAvailableSpace = strLen - windowLength; // Total length available for sliding windows.it rep how far a window can slide
        const numberOfGaps = (numWindows - 1) || 1;        // Number of gaps between windows; avoid division by zero
        const gapSize = totalAvailableSpace / numberOfGaps;
        const start = Math.floor(i * gapSize);// Evenly spaced start point
        const clampedStart = Math.max(0, Math.min(start,totalAvailableSpace));//to ensure the start is at a valid index
        const window = normalizedStr.slice(clampedStart,clampedStart + windowLength);

        const sliceScore = calcDistanceScore(normalizedQuery,window,minThreshold/queryLen);//made the min threshold here inversely proportional to the length of the query and directly to the minThreshold
        const penalty = getPenalty(queryLen,strLen,minThreshold) //long string diff penalty
        sliceScores.push(sliceScore - penalty);//deducts the penalty from the slice score
        if (queryLen > strLen) {//handles the edge case where the query is longer than the window to save computation
            break
        }
    };
    const maxSliceScore = roundToTwo(Math.max(...sliceScores));

    const weightDistance = 0.2;
    const weightSubsequence = 0.3;
    const weightWindow = 0.5;
    const score = roundToTwo((fullDistanceScore * weightDistance) + (Math.max(0,maxSliceScore) * weightWindow) + (scaledSubsequenceScore * weightSubsequence));
    
    fuzzyCache.set(cacheKey,score);
    console.log('Scores: ',fullDistanceScore,Math.max(0,maxSliceScore),scaledSubsequenceScore);
    return score;
}
const testCasesAt40 = [
    // Exact and near-exact matches
    { query: "London", target: "London", minThreshold: 40 },
    { query: "Londin", target: "London", minThreshold: 40 }, // typo
  
    // Common spelling mistakes and missing spaces
    { query: "123 Avvenue Road", target: "123 Avenue Road", minThreshold: 40 },
    { query: "123Avenue Road", target: "123 Avenue Road", minThreshold: 40 },
  
    // Different types or abbreviations
    { query: "123 Avenue St", target: "123 Avenue Road", minThreshold: 40 },
    { query: "St. Louis", target: "Saint Louis", minThreshold: 40 },
  
    // Partial substrings and reordered tokens
    { query: "Joseph Biden", target: "Joseph R Biden", minThreshold: 40 },
    { query: "Biden Joseph", target: "Joseph R Biden", minThreshold: 40 },
  
    // Missing or extra characters
    { query: "Cincinatti", target: "Cincinnati", minThreshold: 40 },
    { query: "Raliegh", target: "Raleigh", minThreshold: 40 },
  
    // Case differences and punctuation
    { query: "document.txt", target: "Document.TXT", minThreshold: 40 },
    { query: "file-share", target: "fileShare", minThreshold: 40 },
  
    // No match or very low similarity
    { query: "xyz", target: "fileSharepyennnnnn", minThreshold: 40 },
    { query: "abc", target: "document.txt", minThreshold: 40 },
  ];
  
  // Example usage to test and print scores
  for (const { query, target, minThreshold } of testCasesAt40) {
    const score = getMatchScore(query, target, minThreshold);
    console.log(`Query: "${query}" | Target: "${target}" | Threshold: ${minThreshold}% => Score: ${score}`);
  }
  