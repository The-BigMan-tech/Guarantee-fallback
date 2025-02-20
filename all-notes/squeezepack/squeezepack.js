"use strict";
//ngrok vite plugin.Dont expose your server to all addresses and dont hardcode variables
//*Not tested when the array begins with 0
//*Only works for arrays of positive integers
//*by conserving time,i consume more memory and by conserving space,i might take more time
//tunnellling service
//localtunnel
//My algorithm optimizes the size of integers ending with 0s by representing how many number of zeros there are with a negated integer.Its negated so that my algorithm can differentiate between 0s in chunks and actual numbers in chunks.It only does this if the zeros are too big that some of the zeros chunks of to another chunk.I did this because js will represeny chunks of 0s as just 0 which will lose the retention of some integers since my alorithm requires that they should be squashed into one chunk not to mention that even if js could represent them as they were,this one will conserver more space as repeated 0s wont take up new chunks and therefore reducing the size of the compressed array
//The decoder doesnt decompress the array,it only knows how to read it
//my push method has to compress when its done to ensure that the output array is always compressed to a smaller size than the input array thats if the input array wasnt compressed before pushing and it also ensures that the array after pushing will always be retained in its compressed form
//My push method checks if the array is compressed,if it is,it will read that but if not,it will take it as it is and compress the array after performing the operation.This is to ensure that the push method doesnt compress the array twice just for the sake of reading the array into its original form
//The push method will always decompress the array,so that the array will always be the compressed version of the up to date array
//So the at method will always compress before reading except that the compress method checks if the array is compressed before compressing meaning that the at method will only compress the array once that is the first time its called if it isnt compressed and the push method will only and always recompress after writing
Object.defineProperty(exports, "__esModule", { value: true });
exports.TinyPack = void 0;
//by default,the algorithm will defer compression till explicitly stated using the this.compress method or implicitly when you call methods like at or push but i provided another method called defer compression.what it does is that it returns the array as it is provided that it isnt compressed so that you can chain it with normal array operations that wont compress the array but if the array is already compressed,performing normal array operations on it can lead to unexpected behaviour when you use the same array later on,thats why this method exists to always check the state of compression on the dev's behalf for safety rather than the dev calling the normal array methods directly on the this.array as it may or may not be compressed.It allows the dev to modify the array without triggering compression
//the defer compression be used to implement a batch of operations on the uncompressed before compressing it rather than triggering compression when a method is called.This in addition to the compress and decompress method for explicitly compressing and decompressing the array explicitly ensures that the compression of the array is in the full control of the dev or the dev can stick to the default behaviour where the array class will defer compression till a method is called.The default behaviour will do for many use cases
//The object overhead is negligible if it provides siginificantt compression benefit.Ill use it to send long integer arrays over a network 
//My algorithm takes advantage of js represents numbers and as such,it will only work in js
//Ill make different algorithms that takes adavantage of how different programming languages stores numbers
//*my algorithm completely breaks when if an integer is 20 digits long
//todo:supporting arrays that starts with 0 by using the chunk separator
//todo:use the chunk separator for the common elements on both sides that chunks share
//!pictures
//^quantum computers
/**
 * It converts a decimal number to base 9 as a string type
 * @param num the number to convert to base 9
 * @returns the number in base 9
 */
function decimalToBase9(num) {
    if (num === 0)
        return '0';
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
function base9ToDecimal(base9Str) {
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
function Compress(array) {
    if (array.length == 0) {
        return array;
    }
    let firstChunk = '';
    let leftChunks = [];
    let secondChunk = '';
    let rightChunks = [];
    //Produces the concatenated integer and count information chunks
    for (let num of array) {
        let numLength = Number(num.toString().length);
        firstChunk += num.toString();
        secondChunk += `${decimalToBase9(numLength).toString()}9`;
    }
    //Pushes the chunks to their respective chunk arrays in preparation that they might be too big
    leftChunks.push(firstChunk);
    rightChunks.push(secondChunk);
    //Splitting the two chunks into smaller ones as they grow to preserve precision
    while ((leftChunks.at(-1).length > 16)) { //Breaks the first chunk to smaller chunks
        const lastLeftChunk = leftChunks.at(-1) || '';
        console.log('last left chunk', lastLeftChunk);
        if (lastLeftChunk.slice(16).startsWith('0')) {
            const chunkedWithZeros = lastLeftChunk.slice(16);
            console.log('starts with 0', chunkedWithZeros);
            const lastZeroIndex = chunkedWithZeros.lastIndexOf('0') + 1;
            const chunkOfZeros = chunkedWithZeros.slice(0, lastZeroIndex);
            const chunkOfNonZeros = chunkedWithZeros.slice(lastZeroIndex);
            console.log('CHUNK OF ZEROS', chunkOfZeros);
            leftChunks.push(`1`);
            leftChunks.push(chunkOfNonZeros);
        }
        else {
            leftChunks.push(lastLeftChunk.slice(16));
        }
        const secondToLastLeftChunk = leftChunks[leftChunks.length - 2] || lastLeftChunk;
        leftChunks[leftChunks.length - 2] = secondToLastLeftChunk.slice(0, 16);
    }
    while (rightChunks.at(-1).length > 16) { //Breaks the second chunk to smaller chunks  
        const lastRightChunk = rightChunks.at(-1);
        rightChunks.push(lastRightChunk.slice(16));
        const secondToLastRightChunk = rightChunks[rightChunks.length - 2] || lastRightChunk;
        rightChunks[rightChunks.length - 2] = secondToLastRightChunk.slice(0, 16);
    }
    leftChunks = leftChunks.filter(e => e.length > 0);
    const leftChunksAsNumbers = leftChunks.map(Number);
    const rightChunksAsNumbers = rightChunks.map(Number);
    return [...leftChunksAsNumbers, 0, ...rightChunksAsNumbers];
}
function Dechunk(compressedArray) {
    console.log('Compressed array', compressedArray);
    let dechunkedArray = ['', ''];
    let zeroIndex = 0;
    for (let [index, num] of compressedArray.entries()) {
        // console.log('num: ',num);
        if (num < 0) { //*checks if the number is negative
            console.log('Less than 0', num);
            dechunkedArray[0] += ('0'.repeat(Math.abs(num)));
        }
        else if ((num != 0) && !(zeroIndex)) { //*If the num is not zero which acts as the separator and the zero index hasnt been decided,append it to the first chunk
            dechunkedArray[0] += String(num);
        }
        else if (num == 0) { //*if the number is the 0 separator,it should write the zero index
            zeroIndex = index;
        }
        else { //*else it will chunk it with the second element
            dechunkedArray[1] += String(num);
        }
    }
    console.log('DECHUNKED', dechunkedArray);
    return dechunkedArray;
}
function DecodeForIndex(dechunkedArray, index) {
    //*starting from somewhere then count till ?
    const concatenatedArray = dechunkedArray[0].toString().split('');
    let countInstructions = (dechunkedArray[1].toString()).split("9");
    countInstructions.pop(); //*removes that empty index
    countInstructions = countInstructions.map(element => base9ToDecimal(element));
    let start = 0;
    let count = Number(countInstructions[index]);
    for (let [i, num] of countInstructions.entries()) {
        if (i < index) {
            start += Number(num);
        }
    }
    ;
    let startingElement = concatenatedArray[start];
    for (let endingIndex = 1; endingIndex < count; endingIndex++) {
        const element = concatenatedArray[start + endingIndex];
        if (element) {
            startingElement += concatenatedArray[start + endingIndex];
        }
    }
    return Number(startingElement);
}
/**
 * the array can be created by either putting it directly in the constructor or using the data setter.When you use the setter or the constructor to assign it a new array,it will not compress it immediately but will rather leave the array uncompressed/it will defer the compression of the array till any methods from the class are called to operate on the array to ensure that no time is wasted to compress the array till the array is needed to be compressed and that the resulting array from any operation is compressed for memory efficiency.Thats the default behaviour but you can explicitly compress and decompress the array at any time using the methods and as such,you can choose to compress the array right from its assignment or you can control which array operation you want to result in a compression in order to preserve time over memory when needed.The thing is just that working with a compressed array will save memory but cost more time and working with a decompressed one will save time but will not benefit from memory efficiency.The compression process can also lead to temporary memory spikes because the function compressing the array might take a lot of memory but after its done,its cleaned up.The compressed array version of the read operation will compress the array and then read its values while the write operations will decompress it,modify it and recompress it again and as such,they may be heavy to compute.The compress and decompress methods provide good control over when the array is compressed although or not and controlled compression is better if the usage and size of the array is unpredictable.the resulting array from the pushed array doesnt increase the size of the array provided that (x > 0) and (y <= x) where x is the space left in the last chunk holding the concatenated integers of the array which is mathematically = (length of the concatenated integers of the array % 16) and y is the length of the integer.
 */
class TinyPack {
    array = [];
    isCompressed = false;
    set data(new_array) {
        this.array = new_array;
    }
    constructor(array) {
        this.array = array || [];
    }
    compress() {
        if (this.isCompressed == false) {
            this.array = Compress(this.array);
            this.isCompressed = true;
            return;
        }
    }
    readCompressedData() {
        const decompressedArray = [];
        let index = 0;
        while (DecodeForIndex(Dechunk(this.array), index) >= 0) {
            const element = DecodeForIndex(Dechunk(this.array), index);
            decompressedArray.push(element);
            index += 1;
        }
        return decompressedArray;
    }
    decompress() {
        if (this.isCompressed == true) {
            this.array = this.readCompressedData();
            this.isCompressed = false;
            return;
        }
    }
    at(index) {
        this.compress();
        console.log('Read compressed data', this.readCompressedData());
        const number = this.readCompressedData().at(index);
        return number;
    }
    push(num) {
        let newArray = [];
        console.log('IS COMPRESSED?', this.isCompressed);
        if (this.isCompressed) {
            newArray = this.readCompressedData();
            console.log('its compressed');
        }
        else {
            console.log('its not compressed');
            newArray = this.array;
        }
        newArray.push(num);
        this.array = newArray;
        this.isCompressed = false; //*as you can see above,its no longer compressed again
        this.compress();
        console.log('THIS ARRAY', this.array);
    }
    deferCompression() {
        if (this.isCompressed == false) {
            return this.array;
        }
        else {
            throw new Error('Cant defer the compression as the array is already compressed');
        }
    }
    get length() {
        return this.array.length;
    }
    get data() {
        return this.array;
    }
}
exports.TinyPack = TinyPack;
