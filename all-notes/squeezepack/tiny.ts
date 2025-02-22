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
function base9ToDecimal(base9Str:string):number {
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
    public data:number[] = []
    private isCompressed:boolean = false
    constructor(array?:number[]) {
        this.data = array || []
    }
    public compress():void {
        if (this.isCompressed == false) {//provides compression safety
            let chunk:string = ''
            this.data.forEach(num=>chunk += `${decimalToBase9(num).toString()}9`)
            const range = chunk.length;
            const lengthOfCompressedArray = Math.ceil(range/15)
            console.log('Weight',this.data.length,lengthOfCompressedArray);
            if (this.data.length > lengthOfCompressedArray) {
                let chunks:string[] = []
                for (let i = 0;i < range;i+=15) {
                    const smallerChunk:string = chunk.slice(i,i+15)
                    chunks.push(smallerChunk)
                }
                const chunksAsNumbers:number[] = chunks.map(Number)
                this.data = chunksAsNumbers
                this.isCompressed = true
            }
        }
    }
    public decompress():void {
        this.data = this.returnUncompressedArray();
        this.isCompressed = false;
    }
    public skipCompression() {
        return (this.isCompressed==false)?this.data:(() => { throw new Error("The array is already compressed so you cant skip it") })();
    }
    private dechunk():string {
        let chunk:string = ''
        this.data.forEach(num=>chunk += num.toString())
        return chunk
    }
    private read(chunk:string):number[] {
        let originalArray = []
        chunk.startsWith('9')?originalArray.push(0):''//since 9 is a delimeter,it only appears first if there was a zero before it.
        originalArray = [...chunk.split('9').map((element)=>base9ToDecimal(element))]
        originalArray = originalArray.slice(0,originalArray.length-1)
        return originalArray
    }
    private returnUncompressedArray():number[] {
        let originalArray:number[] = (this.isCompressed)?this.read(this.dechunk()):this.data
        return originalArray
    }
    public push(num:number):void {
        let originalArray:number[] = this.returnUncompressedArray()
        originalArray.push(num)
        this.data = originalArray
        this.isCompressed = false
        this.compress()
    }
    public at(index:number):number | undefined {
        let originalArray:number[] = this.returnUncompressedArray()
        this.compress()
        return originalArray.at(index)
    }       
}
const grades = new Tiny()
grades.data = [1,2222222222222222222222]
grades.compress()
console.log(grades.data);
console.log(grades.at(0));
grades.push(25)
console.log(grades.data);

const scores = new Tiny()
scores.data = [0,0,1,999,46]//wont compress immediately till later
scores.compress()
scores.data = [1,2,3,4]
scores.compress()
console.log(scores.data)

//*my messy algorithm grew from 158 lines of code to just 50 lines and it compress twice as better.Thats the growth of an algorithm

//*For loops take two forms:iterators and range constructs.To iterate over elements of an array,ill use the for each loop as it looks shorter and more concise while for range contructs,ill use traditional for loops

//*vscode debugger isnt working

//*this new one doesnt use two types of chunks unlike the last one but instead uses only one type of chunk which is the chunk that holds the concatenated integers.it turns them to base 9 so that it can use 9 as a delimeter

//*my new implementation of my algorithm has a best case of 8 bytes as it can compress a js array of two numbers into one which means that it will only provide no benefit if the array length is 1 or if an integer is too long so this new one not only defers compression till needed but it also compresses only if it knows that the compression algorithm will provide any benefit.When you perform a push,it will assign the array the uncompressed version before perfomring a compression to get a compressed output but since the compression is conditional,it also means that when you attempt to push to a compressed array,it will check if the resulting compressed array will have any benefit from the compression and as such,it can uncompress an array to its original form as well if it was compressed before pushing.This will prevent unnecessary time from being wasted in compression where there will be no benefits.so its a compression manager for your non zero integer arrays

//*i also saved my push from compressing twice

//*Leaving everything default without manually controlling the compression will let the algorithm decide the best time to compress the array.So my class is an integer array that is packed with automatic compression management benefits

//*skipping the compression is to tell an operation to perfrom without triggering any compression.Its best for batching operations before you manually compress rather than compressing on every operation.

//*if you use read operations,it will never compress again after compressing once while for push,it always recompress unless compression wont provide any benefit.

//*I made the is compressed private because directly modifying it when its not certain that the array is compressed or not will lead to unexpected behaviour of the compression management and thats why compress and decompress are there in order to provide a safer way to compress and decompress the array.

//*Dechunk and read are private because they are only meant to be used by the algorithm to read the compressed array.

//*return uncompressed array is private because storing the value of this in another variable will lead to two types of the same array being stored in memory and as such,the user should use the decompress method whenever they need the decompressed form of an array in  order to ensure that only one type of the array is stored in memory.

//todo:can use negative to indicate that the chunk on the left is the same on the right

//*There is floor division,ceiling division,normal division,round division
//*My algorithm is only for non negative arrays and its optimized for js number representation.

//*So my array class is a non negative integer array but supercharged with compression management

//*standard if statements,one liner if statements

//!i need to know when to take opportunities and not
