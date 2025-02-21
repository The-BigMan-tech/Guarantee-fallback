"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function base9ToDecimal(base9Str) {
    let decimal = 0;
    const length = base9Str.length;
    for (let i = 0; i < length; i++) {
        const digit = parseInt(base9Str[length - 1 - i], 10); // Get digit from right to left
        decimal += digit * Math.pow(9, i); // Convert to decimal
    }
    return decimal;
}
//*implement as many array methods as possible
class Tiny {
    data = [];
    isCompressed = false;
    constructor(array) {
        this.data = array || [];
    }
    compress() {
        if (this.isCompressed == false) {
            let chunk = '';
            this.data.forEach(num => chunk += `${decimalToBase9(num).toString()}9`);
            const range = chunk.length;
            const lengthOfCompressedArray = Math.ceil(range / 15);
            console.log('Weight', this.data.length, lengthOfCompressedArray);
            if (this.data.length > lengthOfCompressedArray) {
                let chunks = [];
                for (let i = 0; i < range; i += 15) {
                    const smallerChunk = chunk.slice(i, i + 15);
                    chunks.push(smallerChunk);
                }
                const chunksAsNumbers = chunks.map(Number);
                this.data = chunksAsNumbers;
                this.isCompressed = true;
            }
        }
    }
    decompress() {
        this.data = this.returnUncompressedArray();
        this.isCompressed = false;
    }
    skipCompression() {
        return (this.isCompressed == false) ? this.data : (() => { throw new Error("The array is already compressed so you cant skip it"); })();
    }
    dechunk() {
        let chunk = '';
        this.data.forEach(num => chunk += num.toString());
        return chunk;
    }
    read(chunk) {
        let originalArray = [];
        chunk.startsWith('9') ? originalArray.push(0) : ''; //since 9 is a delimeter,it only appears first if there was a zero before it.
        originalArray = [...chunk.split('9').map((element) => base9ToDecimal(element))];
        originalArray = originalArray.slice(0, originalArray.length - 1);
        return originalArray;
    }
    returnUncompressedArray() {
        let originalArray = (this.isCompressed) ? this.read(this.dechunk()) : this.data;
        return originalArray;
    }
    push(num) {
        let originalArray = this.returnUncompressedArray();
        originalArray.push(num);
        this.data = originalArray;
        this.isCompressed = false;
        this.compress();
    }
    at(index) {
        let originalArray = this.returnUncompressedArray();
        this.compress();
        return originalArray.at(index);
    }
}
const grades = new Tiny();
grades.data = [1, 2222222222222222222222];
grades.compress();
console.log(grades.data);
console.log(grades.at(0));
grades.push(25);
console.log(grades.data);
const scores = new Tiny();
scores.data = [0, 0, 1, 999999999999]; //wont compress immediately till later
scores.compress();
scores.skipCompression().push(40);
console.log(scores.data);
//*my messy algorithm grew from 158 lines of code to just 50 lines and it compress twice as better.Thats the growth of an algorithm
//*For loops take two forms:iterators and range constructs.To iterate over elements of an array,ill use the for each loop as it looks shorter and more concise while for range contructs,ill use traditional for loops
//*vscode debugger isnt working
//*this new one doesnt use two types of chunks unlike the last one but instead uses only one type of chunk which is the chunk that holds the concatenated integers.it turns them to base 9 so that it can use 9 as a delimeter
//*my new implementation of my algorithm has a best case of 8 bytes as it can compress a js array of two numbers into one which means that it will only provide no benefit if the array length is 1 or if an integer is too long so this new one not only defers compression till needed but it also compresses only if it knows that the compression algorithm will provide any benefit.so its a compression manager
//*Leaving everything default without manually controlling the compression will decide the best time to compress the array.So my class is an integer array that is packed with automatic compression management benefits
//todo:can use negative to indicate that the chunk on the left is the same on the right
//*There is floor division,ceiling division,normal division,round division
//*My algorithm is only for non negative arrays and its optimized for js number representation.
//*So my array class is a non negative integer array but supercharged with compression management
