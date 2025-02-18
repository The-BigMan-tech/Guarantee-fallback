//*safe integer means the largest integer js can handle without losing prceision and thats wh y numbers will always be 8 bits long no matter how big because js will throw away precision as the number gets closer to the safe integer number but you can use big int as an alternative but it will consume a lot more space
//*Chunks off zeros as separate elements but should rather chunk an integer with it.The number got approximated before my algorithm could get its hands on it
//*Doesnt chunk off previous elements

//*This algorithm wont compress anything much or might even cause it to be bigger if the individual integers in the array are too long.The space complexity remains constant as the array length grows but it will only grow if the length of the concatenated integers increases so its best for integer arrays where each integer isnt long but medium.I'll call it squeezepack.its key hack is concatenation.

//*Update the decoder to read at base 9
//*The Dechunker

//*so its best for short-medium integers but long arrays and little to poor for short but long integer arrays
//*In the best case scenario,my algiruthm compresses the array size to three elements because.The last two are overhead used by my algorithm to understand how to read the squashed concatenated integer and as such,my algorithm is best for integer arrays that have more than three elements.The space complexity remains constant as the array size increases.It only increases when the length of the concatenated integers increases meaning that if the array has too long integers but the length is shorter,it wont provide much of a difference and it can even be longer but if its individual integers arent too long but its length is very long,it will perform a huge compression.so therfore,the compression efficiency is directly proportional to the array length but inversely proportional to the length of the concatenated integers

//*the dechunker doesn't generate the original array from the compressed version because its easier to generate a format that the decoder is programmed to understand than implementing another complex algorithm that will give back the original uncompressed array. The dechunked array will always be an array of two long strings

function decimalToBase9(num) {
    if (num === 0) return '0';
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
    console.log('DECIMAL VERSION: ',base9Str)
    return decimal;
}
function compressArray(array) {
    let firstElement = ''
    let firstArray = []
    let secondElement = ''
    let secondArray = []
    let nonZeroIndex = 0
    for (let num of array) {
        console.log('Number: ',num)
        numLength = Number(num.toString().length)
        firstElement += num.toString()
        secondElement += `${decimalToBase9(numLength).toString()}9`
    }
    firstArray.push(firstElement)
    secondArray.push(secondElement)

    console.log('First Element as a string',firstElement)
    while (firstArray.at(-1).length > 16) {
        const lastElement = firstArray.at(-1)
        console.log('Last Element: ',lastElement)

        if (lastElement.endsWith('0')) {
            const lastZeroOccurence = lastElement.indexOf('0')
            console.log('Ends with 0 at index',lastZeroOccurence)
            //*this block is to get the index of the last digit before the first zero that ends the string
            for (let i = (lastElement.length);i >= 0 ;i--) {
                const indexOrZero = lastElement[i]
                if (indexOrZero > 0) {
                    console.log('Found the non zero index',indexOrZero);
                    nonZeroIndex = i
                    break;
                }
            }
            firstArray.push(lastElement.slice(16,nonZeroIndex))
            firstArray.push(lastElement.slice(nonZeroIndex))
            const thirdToLastElement = firstArray[firstArray.length - 3] || lastElement
            firstArray[firstArray.length - 3] = thirdToLastElement.slice(0,16)
        }else {
            firstArray.push(lastElement.slice(16))
            const secondToLastElement = firstArray[firstArray.length - 2] || lastElement
            firstArray[firstArray.length - 2] = secondToLastElement.slice(0,16)
        }
    }
    console.log('Second element as a string',secondElement)
    while (secondArray.at(-1).length > 16) {    
        const lastElement2 = secondArray.at(-1)
        secondArray.push(lastElement2.slice(16))
        const secondToLastElement2 = secondArray[secondArray.length - 2] || lastElement2
        secondArray[secondArray.length - 2] = secondToLastElement2.slice(0,16)
    }
    firstElement = Number(firstElement)
    console.log('First Element as a number',firstElement)
    secondElement = Number(secondElement)
    console.log('Second Element as a number',secondElement)

    console.log('FIRST ARRAY',firstArray)
    console.log('SECOND ARRAY',secondArray)

    firstArray = firstArray.filter(e=>e.length > 0)

    firstArray = firstArray.map(Number)
    secondArray = secondArray.map(Number)

    return [...firstArray,0,...secondArray]
}
function Dechunk(compressedArray) {
    let dechunkedArray = ['','']
    let zeroIndex = 0
    for (let [index,num] of compressedArray.entries()) {
        if ((num != 0) && !(zeroIndex)) {//*If the num is not zero which acts as the separator and the zero index hasnt been decided,append it to the first chunk
            dechunkedArray[0] += String(num) 
        }else if (num == 0) {//*if the number is the 0 separator,it should write the zero index
            zeroIndex = index
        }else {//*else it will chunk it with the second element
            dechunkedArray[1] += String(num)
        }
    }
    console.log('DECHUNKED ARRAY: ',dechunkedArray)
    return dechunkedArray
}
function Decode(compressedArray,index) {
    //*starting from somewhere then count till ?
    const concatenatedArray = compressedArray[0].toString().split('');
    let countInstructions = (compressedArray[1].toString()).split("9");
    console.log('COUNT INSTRUCTIONS IN BASE 9: ',countInstructions)
    countInstructions.pop()//*removes that empty index
    countInstructions = countInstructions.map(element=>{
        console.log('ELEMENT',Number(element))
        return base9ToDecimal(element)
    })
    console.log('COUNT INSTRUCTIONS IN BASE 10: ',countInstructions)

    let start = 0;
    let count = Number(countInstructions[index]);
    for (let [i,num] of countInstructions.entries()) {
        if (i < index) {
            start += Number(num);
        }
    }
    let startingElement = concatenatedArray[start];
    for (let endingIndex = 1;endingIndex < count;endingIndex++) {
        const element = concatenatedArray[start + endingIndex]
        if (element) {
            startingElement += concatenatedArray[start + endingIndex];
        }
    }
    return Number(startingElement)
}
function retrieveElement(array,index) {
    return Decode(Dechunk(array),index)
}
function getSize(array) {
    return (array.length * 8)
}
function logMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    console.log(`Memory Usage: RSS: ${memoryUsage.rss}, Heap Used: ${memoryUsage.heapUsed}`);
}
const arrayA = [1,2,3,4,4]
console.log('Uncompressed Array Size in bytes: ',getSize(arrayA))

const compArray = compressArray([1,2,3,4,4])
console.log('Compressed Array: ',compArray)
console.log('Compressed Array Size in bytes: ',getSize(compArray))

const requiredElement  = retrieveElement(compArray,4)
console.log('Required element: ',requiredElement)
