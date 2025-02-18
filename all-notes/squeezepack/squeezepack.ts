//*Not tested when the array begins with 0
/**
 * It converts a decimal number to base 9 as a string type
 * @param num the number to convert to base 9
 * @returns the number in base 9
 */
function decimalToBase9(num:number):string {
    if (num === 0) return '0';
    let base9 = '';
    while (num > 0) {
        const remainder = num % 9;
        base9 = remainder.toString() + base9; // Prepend to build the number
        num = Math.floor(num / 9);
    }
    return base9;
}
/**
 * It converts a base 9 number as a string type to a number type in base 10
 * @param base9Str the number in base 9 as a string to convert back to a base 10 number
 * @returns the number in base 10
 */
function base9ToDecimal(base9Str:string):number {
    let decimal = 0;
    const length = base9Str.length;
    for (let i = 0; i < length; i++) {
        const digit = parseInt(base9Str[length - 1 - i], 10); // Get digit from right to left
        decimal += digit * Math.pow(9, i); // Convert to decimal
    }
    return decimal;
}
/**
 It takes an array of integers and returns a compressed version according to my squeeze algorithm whereby *   each integer of the array is concatenated into one big number and then inserted into an array which will take less space than when the integers are separated in an array since a number in js will always be represented as 8 bytes at the cost of precision loss as the number grows.It will also require a way to read this large chunk of data so a second big chunk of integers holds information about how to read the first chunk containing the squashed integer data when data needs to be retrieved and a third element which always be 0 as it marks the place where the compressed chunk data in the array ends and the count information chunk begins.The result of the compressed array from the algorithm is something that will look messy when printed out but its worth while the space and there are abstractions provided to work with the compressed data.Since the algorithm requires this space benefit and that the concatenated number should not loose any precision since every digit will make a difference to the information retention in the compressed array which will lead to a lossy compression,it will chunk the concatenated array into smaller concatenated numbers as it grows as well as the count information number as it grows.The count information is written in a single long chunk number where each piece of info is in the format(number of integers to read)(digit as a terminator).for example [1,2,3,42],the compressed array will be [12342,10101020] where the first element is the concatenated integer chunk and the second one says;read the first integer of the first chunk,stop and return that as the first element,then to get the third element,it says read the two integers of the first chunk starting from the last point which is provided by another algorithm,stop and return that as the third element.This is to ensure that the count info chunk benfits from the 8bytes storage that js uses for numbers over using a string that takes 2 bytes per character but the program will have no way of telling when a digit is a terminator or part of the count information so it represents the count information itself is represented in base 9 where only digits 0-8 are used and uses the 9 digit as the terminator all in a base 10 number.The algorithm will then convert the count information to astring,split it by the digit 9,get the array of base 9 information and convert each one to base 10 and then the progam will use that information in the program.This method conserves space over using a normal string with a termiinator not to mention that it can chunk to retain information and avoid losing precision.This algorithm is best for longer arrays that have shorter-medium sized integers but gradually performs poorly as the array gets smaller with larger individual integers.The best case scenario of this algorithm is 24 bytes where the compressed array will only hold three elements:concatenated integer data,0 as the terminator and the count info chunk as the count information.It will not change anything if the array length is three and it will increase the array size up to 24 bytes if the array's length is <= 2.The decoder that can read this compressed array cant read it directly because of the fact that it was originally deisgned to read an array of two strings where they are the string conversions of the concatenated integer data and count data respectively but as the algorithm grew,there was a need to chunk this data into smaller numbers as discussed earlier so there is another function called the dechunker that takes this compressed array and chunks them into a compact two length array of strings which serves as an intermediate format that the decoder can read.
 * @param array te array of integers you want to compress
 * @returns the compressed array of integers
 */
function Compress(array:number[]):number[] {
    let firstChunk:string = ''
    let leftChunks:string[]  = []
    let secondChunk:string = ''
    let rightChunks:string[] = []
    let nonZeroNumberIndex:number = 0

    //Produces the concatenated integer and count information chunks
    for (let num of array) {
        let numLength:number = Number(num.toString().length)
        firstChunk += num.toString()
        secondChunk += `${decimalToBase9(numLength).toString()}9`
    }
    //Pushes the chunks to their respective chunk arrays in preparation that they might be too big
    leftChunks.push(firstChunk);
    rightChunks.push(secondChunk);

    //Splitting the two chunks into smaller ones as they grow to preserve precision
    while (((leftChunks.at(-1) as string).length > 16)) {//Breaks the first chunk to smaller chunks
        const lastLeftChunk:string = leftChunks.at(-1) || ''
        if (lastLeftChunk.endsWith('0')) {//This is to ensure that the integer zero cant be its own chunk because its used by my algorithm as a terminator or the center between the left and right chunks of data in the compressed array
            //this block is to get the index of the last digit before the first zero that ends the string
            for (let i = (lastLeftChunk.length);i >= 0 ;i--) {
                const zeroOrNonzero:number = Number(lastLeftChunk[i])
                if (zeroOrNonzero > 0) {
                    nonZeroNumberIndex = i
                    break;
                }
            }
            leftChunks.push(lastLeftChunk.slice(16,nonZeroNumberIndex))
            leftChunks.push(lastLeftChunk.slice(nonZeroNumberIndex))
            const thirdToLastLeftChunk:string = leftChunks[leftChunks.length - 3] || lastLeftChunk
            leftChunks[leftChunks.length - 3] = thirdToLastLeftChunk.slice(0,16)
        }else {
            leftChunks.push(lastLeftChunk.slice(16))
            const secondToLastLeftChunk:string = leftChunks[leftChunks.length - 2] || lastLeftChunk
            leftChunks[leftChunks.length - 2] = secondToLastLeftChunk.slice(0,16)
        }   
    }
    while ((rightChunks.at(-1) as string).length > 16) {//Breaks the second chunk to smaller chunks  
        const lastRightChunk = rightChunks.at(-1) as string
        rightChunks.push(lastRightChunk.slice(16))
        const secondToLastRightChunk = rightChunks[rightChunks.length - 2] || lastRightChunk
        rightChunks[rightChunks.length - 2] = secondToLastRightChunk.slice(0,16)
    }
    leftChunks = leftChunks.filter(e=>e.length > 0)
    const leftChunksAsNumbers:number[] = leftChunks.map(Number)
    const rightChunksAsNumbers:number[] = rightChunks.map(Number)

    return [...leftChunksAsNumbers,0,...rightChunksAsNumbers]
}
function Dechunk(compressedArray:number[]):string[] {
    let dechunkedArray:string[] = ['','']
    let zeroIndex:number = 0
    for (let [index,num] of compressedArray.entries()) {
        if ((num != 0) && !(zeroIndex)) {//*If the num is not zero which acts as the separator and the zero index hasnt been decided,append it to the first chunk
            dechunkedArray[0] += String(num) 
        }else if (num == 0) {//*if the number is the 0 separator,it should write the zero index
            zeroIndex = index
        }else {//*else it will chunk it with the second element
            dechunkedArray[1] += String(num)
        }
    }
    return dechunkedArray
}
function DecodeForIndex(dechunkedArray:string[],index:number):number {
    //*starting from somewhere then count till ?
    const concatenatedArray:string[] = dechunkedArray[0].toString().split('');
    let countInstructions:string[] | number[] = (dechunkedArray[1].toString()).split("9");
    countInstructions.pop()//*removes that empty index
    countInstructions = countInstructions.map(element=>base9ToDecimal(element))

    let start:number = 0;
    let count:number = Number(countInstructions[index]);
    for (let [i,num] of countInstructions.entries()) {
        if (i < index) {
            start += Number(num);
        }
    };
    let startingElement:string = concatenatedArray[start];
    for (let endingIndex:number = 1;endingIndex < count;endingIndex++) {
        const element:string = concatenatedArray[start + endingIndex]
        if (element) {
            startingElement += concatenatedArray[start + endingIndex];
        }
    }
    return Number(startingElement)
}
class SqueezePack {
    public array:number[] = []
    constructor(array:number[]) {
        this.array = Compress(array)
    }
    public returnElement(index:number):number {
        return DecodeForIndex(Dechunk(this.array),index)
    }
    public returnLength():number {
        return this.array.length
    }
    public returnCompressedArray():number[] {
        return this.array
    }
    public returnUncompressedArray():number[] {
        const unCompressedArray = []
        const unCompressedArrLength = ((Dechunk(this.array)[1].split('9')).length) - 1 
        for (let i = 0;i < unCompressedArrLength;i++) {
            unCompressedArray.push(this.returnElement(i))
        }
        return unCompressedArray
    }
}
function getSize(array:number[]):number {
    return (array.length * 8)
}
const compArray = new SqueezePack([1,2,3,4,5,6,7,8,99])
const requiredElement:number  = compArray.returnElement(8)
console.log('Required element: ',requiredElement)
