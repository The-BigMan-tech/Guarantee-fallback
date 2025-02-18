//*I call this the Symmpack algorithm
//*Compression for Palindromic arithmetic arrays
//*It uses compression,lazy evaluation and cyclic index calculation
function generateCompressedArr(compressedObject) {
    let compressedArr = []
    const first_term = compressedObject.arr[0]
    const common_difference = (compressedObject.arr[1] - compressedObject.arr[0])
    compressedArr.push(first_term)
    for (let index=1;index < compressedObject.len;index++) {
        const prevNum = compressedArr[index-1] + common_difference
        compressedArr.push(prevNum)
    }
    return compressedArr
}
function getElement(compressedObject,index) {
    let compressedArray = generateCompressedArr(compressedObject)
    let compressedArrlength = compressedArray.length
    let effectiveIndex = (compressedArrlength-1) - (index % compressedArrlength) 
    const part = Math.floor((index/compressedArrlength)) + 1
    if ((part % 2) !== 0) {
        effectiveIndex = (compressedArrlength-1) - effectiveIndex
    }
    const element = compressedArray[index] || compressedArray[effectiveIndex]
    return element
}
function compressArray(array) {
    const compressedArray = [... new Set(array)]
    const furtherCompressedObject = {
        arr:[compressedArray[0],compressedArray[1]],
        len:compressedArray.length
    }
    return furtherCompressedObject
}
function getArraySizeInBytes(array) {
    const jsonString = JSON.stringify(array);
    return new TextEncoder().encode(jsonString).length; // Returns the byte size
}

let arrayA = [1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1]
console.log('ARRAY SIZE',getArraySizeInBytes(arrayA))
const requestedElementFromArray = arrayA[27]
console.log("🚀 ~ requestedElementFromArray:", requestedElementFromArray);


const compressedObject = compressArray(arrayA)
console.log("🚀 ~ compressedObject:", compressedObject,'COMPRESSED OBJECT SIZE',getArraySizeInBytes(compressedObject))
const requestedElementFromObject = getElement(compressedObject,27)
console.log("🚀 ~ requestedElementFromObject:", requestedElementFromObject);

