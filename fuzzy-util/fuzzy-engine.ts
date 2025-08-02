import {distance} from "fastest-levenshtein"
import fuzzysort from 'fuzzysort'
import { LRUCache } from 'lru-cache'


const LruOptions:LRUCache.Options<string,number,unknown>  = {
    max:400,
    allowStale: false,
}
const fuzzyCache = new LRUCache<string,number>(LruOptions)


function removeAllDots(str:string):string {
    return str.replace(/\./g, '');
}
function removeAllSpaces(str:string):string {
    return str.replace(/\s+/g, '');
}
export function normalizeString(str:string):string {
    return removeAllSpaces(removeAllDots(str).trim().toLowerCase());
}
function roundToTwo(num:number):number {
    return Math.round(num * 100) / 100;
}
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
function getNumWindows(minThreshold: number,strLen:number): number {
    const safeDenominator = (minThreshold/100) || (1/8)//defaults to 8 on 0%
    const windowNum = Math.ceil(1/safeDenominator)//20 will give 5 windows
    const cappedWindow = Math.min(windowNum,8);//caps the max window number to 8
    return (strLen<=cappedWindow)?1:cappedWindow;
}  
function getPenalty(queryLen:number,strLen:number,minThreshold:number):number {
    if (queryLen < (strLen/4)) {//only adds a penalty if the query is less than quarter of the target length
        const penaltyScale = 0.05 * minThreshold;//will give 1 if minThreshold = 20.at 100,penalty scale will be 5
        const lengthDifference = Math.abs(strLen - queryLen);
        const penaltyCap = Math.min(minThreshold/2,7)//made the penalty directly proportional to the threshold.if its 20,penalty cap will be 10.capped the penalty to 20 meaning 40+ threshold will give the same cap
        return Math.min(lengthDifference * penaltyScale,penaltyCap);//limits the penalty to 10 and scales the penalty to 0.5 for every length difference.i used 0.5 to smooth out the penalty curve
    }
    return 0
}
function getWeights(minThreshold: number) {
    const t = Math.min(Math.max(minThreshold / 100, 0), 1);
    const weightDistance = 0.3 + (0.5 * t);       // from 0.3 to 0.7
    const weightSubsequence = 0.3 - (0.1 * t);    // from 0.3 to 0.1
    const weightWindow = 0.4 - (0.4 * t); 

    const total = (weightDistance + weightSubsequence + weightWindow);
    return {
        weightDistance: (weightDistance / total),
        weightSubsequence: (weightSubsequence / total),
        weightWindow: (weightWindow / total),
    };
}
/**
 * Gets the fuzzy match score between a query and a target string to measure similarity.
 * 
 * @param {string} query - The string you want to test with.
 * 
 * @param {string} target - The string to test against. The fuzzy score is derived from how close the query is to the target.
 * 
 * @param {number} strictness - Determines how strict or lenient the matcher is (1-100). Lower values are more lenient and higher values are more strict. Values outside this range may yield unexpected results.
 * 
 * Strictness guide:
 *   - 1-9:    Very lenient
 *   - 10-39:  Moderately lenient
 *   - 40-69:  Strict
 *   - 70-99:  Very strict
 *   - 100:    Absolute strictness.
 * 
 * @returns {number} A float between 0 and 100 indicating how close the query matches the target. Results are memoized for performance (cache up to 400 entries, max ~3200 bytes).
 * 
 * @example
 * const score = getFuzzyScore('Hl0o', 'hello', 10);
 * console.log(score);
 * 
 * @note 
 * A strictness value of 100 behaves almost like string equality. It usually gives 0 unless the query is exactly the same as the target (case insensitive) or differs by only a couple of letters. The behaviour varies per query-target pair, and you may still get a low score for strings that are exactly the same.
 * 
 * Low strictness values do not artificially inflate similarity scores. Strictness modifies the tolerance threshold, but the underlying string similarity remains. Thus, strings that hardly or do not match will not receive a good score merely due to low strictness. 
 * 
 * An important nature of fuzziness is that it can give false positives for strings that actually do not match at all. Higher strictness values eliminate false positives but can also give low scores to very similar strings. 
 * 
 * Tune the strictness carefully according to the problem domain or consider adjusting it dynamically as needed.
 */

export function getFuzzyScore(query:string,target:string,strictness:number):number {
    const cacheKey = `${query}|${target}|${strictness}`;
    const cachedResult = fuzzyCache.get(cacheKey);
    if (cachedResult) {//utilize the cache
        return cachedResult;
    }
    const normalizedStr:string = normalizeString(sortTokens(target));//normalize the query and string to prevent irrelavant mistakes make a difference
    const normalizedQuery:string = normalizeString(sortTokens(query));
    const strLen = normalizedStr.length;
    const queryLen = normalizedQuery.length;

    //Distance match and target padding to eliminate false positives.
    const paddingScale = Math.floor(Math.min(0.25 * strictness, 10))//20 will scale the padding to 15,30 will take it .flooring will remove floats and prevent it from growing by 1 unit for decimals
    const paddedStr = normalizedStr.padEnd(paddingScale,'0')
    const fullDistanceScore = calcDistanceScore(normalizedQuery,paddedStr,strictness);

    //Subsequence match
    const subsequenceResult = fuzzysort.single(normalizedQuery,normalizedStr)//used subsequence matching from fuzzysort to get good scores for a query where the distance algorithm would have missed just because of distance
    const subsequenceScore = roundToTwo((subsequenceResult?.score || 0) * 100);
    const lengthRatio = Math.max(roundToTwo(Math.sqrt(queryLen / strLen)),0.4)//this ensures that the length ratio at most only takes away 60% from the score
    const subsequenceBonus = (subsequenceScore)?(100-strictness)/10:0//20% will have a bonus of 8,100 strictness will give a bonus of 0
    const scaledSubsequenceScore = roundToTwo(Math.min((subsequenceScore * lengthRatio) + subsequenceBonus,100));//this is to prevent the subsequence from being too generous for extremely long targets
    

    //Window slicing.
    const numWindows = getNumWindows(strictness,strLen);
    const windowLength = Math.max(queryLen, Math.floor(strLen / numWindows));
    const sliceScores:number[] = [];

    for (let i = 0; i < numWindows; i++) {
        const totalAvailableSpace = strLen - windowLength; // Total length available for sliding windows.it rep how far a window can slide
        const numberOfGaps = (numWindows - 1) || 1;        // Number of gaps between windows; avoid division by zero
        const gapSize = totalAvailableSpace / numberOfGaps;
        const start = Math.floor(i * gapSize);// Evenly spaced start point
        const clampedStart = Math.max(0, Math.min(start,totalAvailableSpace));//to ensure the start is at a valid index
        const window = normalizedStr.slice(clampedStart,clampedStart + windowLength);

        const sliceScore = calcDistanceScore(normalizedQuery,window,strictness/queryLen);//made the min threshold here inversely proportional to the length of the query and directly to the minThreshold
        const penalty = getPenalty(queryLen,strLen,strictness) //long string diff penalty
        sliceScores.push(sliceScore - penalty);//deducts the penalty from the slice score
        if (queryLen > strLen) {//handles the edge case where the query is longer than the window to save computation
            break
        }
    };
    const maxSliceScore = roundToTwo(Math.max(...sliceScores));
    const weights = getWeights(strictness)
    const score = roundToTwo(
        (fullDistanceScore * weights.weightDistance) + 
        (Math.max(0,maxSliceScore) * weights.weightWindow) + 
        (scaledSubsequenceScore * weights.weightSubsequence)
    );
    fuzzyCache.set(cacheKey,score);
    // console.log(`Match Score metrics:Distance: ${fullDistanceScore}| Window: ${Math.max(0,maxSliceScore)}| Subsequence: ${scaledSubsequenceScore}`);
    return score;
}
//the reason why my fuzzy engine doesnt have a leetmap to see some digits in their letter rep like 3 as e or 4 as A is because firstly,it can give false scores even at highly strict levels.so ill the have to decide which strictness level the leetmap should be applied and secondly,a leetmap is domain specific.if my fuzzy engine were to  be used in another domain,like checking for usernames not for english words,then numbers like 3 for E are more intentional than accidental.so using a leetmap to convert it to E can cause false reports for tha domain.so depending on the problem domain,you may wish to use a leetmap to preprocess the data before giving it to the fuzzy engine but the fuzzy engine will not by itself,do that for you.it performs entirely on the arbitrary data you provide it but doesnt assume the problem domain you are planning to use it for

const score = getFuzzyScore('h8l0lo', 'hello', 70);
console.log(score);