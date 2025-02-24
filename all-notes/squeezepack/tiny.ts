//!The notes i wrote below might be countered by preceeding notes because the notes i wrote were in the course of the algorithm's growth over time and as such,the latter ones might contradict some previous ones and if it does,its more accurate to stick to that.

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
function numberToBase64(num:number):string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    while (num > 0) {
        result = chars[num % 64] + result;
        num = Math.floor(num / 64);
    }
    return result || '0'; // Return '0' if the number is 0
}
function base64ToNumber(base64:string):number {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = 0;
    for (let i = 0; i < base64.length; i++) {
        result = result * 64 + chars.indexOf(base64[i]);
    }
    return result;
}
//*implement as many array methods as possible
export class Tiny {
    private array:(number | string)[] = [];
    private isCompressed:boolean = false;
    constructor(array?:number[]) {
        this.data = array || []
    }
    get is_compressed():boolean {
        return this.isCompressed
    }
    get state():(number | string)[] {//*returns the current state of the array whether compressed or uncompressed
        return this.array
    }
    get data():Promise<(number | string)[]> {
        return (async ()=>'')().then(()=>{
            this.compress_safely()
            return this.array
        });   
    }
    set data(newArray:(number | string)[]) {
        this.array = newArray
        this.isCompressed = false
    }
    set compressed_data(newArray:(number | string)[]) {
        this.array = newArray
        this.isCompressed = true
    }
    public optimizeToBase64(lastChunk:number):string | number  {
        const lastChunkAsString:string = lastChunk.toString()
        const lastIndex = lastChunkAsString.length-1
        if (!(lastChunkAsString.startsWith('9')) && (lastChunkAsString.indexOf('9') == lastIndex)) {
            const numBase10 = base9ToDecimal(lastChunkAsString.slice(0,lastIndex))
            if (numBase10 < 260000) {
                const numBase64:string = numberToBase64(numBase10)
                return numBase64
            }
        }
        return lastChunk
    }
    public compress():void  {
        console.log('called compress');
        if (this.isCompressed) {
            throw new Error('Cannot compress an already compressed array')
        }
        let chunk:string = ''
        this.array.forEach(num=>chunk += `${decimalToBase9(Number(num)).toString()}9`)
        let range = chunk.length;
        if (chunk.startsWith('09')) {
            range -= 1
        }
        const startOfLastChunk:number = 15 * Math.floor(range/15);
        let lastChunk:number | string = Number(chunk.slice(startOfLastChunk));
        lastChunk = this.optimizeToBase64(lastChunk)
        const isOptimizedTo64 = typeof lastChunk == 'string'
        const lengthOfCompressedArray = Math.ceil(range/15);
        if ((lengthOfCompressedArray < this.array.length) || isOptimizedTo64) {
            let chunks:string[] = []
            for (let i = 0;i < range;i+=15) {
                const smallerChunk:string = chunk.slice(i,i+15)
                chunks.push(smallerChunk)
            }
            let chunksAsNumbers:(number | string)[] = chunks.map(Number)
            chunksAsNumbers[chunksAsNumbers.length-1] = lastChunk
            this.data = chunksAsNumbers
            this.isCompressed = true
        }
    }
    public compress_safely():void {//will only call compress if it isnt compressed and as such,it wont throw an error if you attempt to compress the array if its already compressed
        (!(this.isCompressed))?this.compress():''
    }
    public decompress():void {
        this.data = this.returnUncompressedArray();//The setter will automatically convert is compressed to false
    }
    public skipCompression() {
        return (this.isCompressed==false)?this.array:(() => { throw new Error("Performing normal array operations on a compressed array will lead to unexpected behaviour") })();
    }
    private dechunk():string {
        let chunk:string = ''
        this.array.forEach(num=>{
            chunk += (typeof num == 'string')?decimalToBase9(base64ToNumber(num.toString())):num.toString()
        })
        chunk += !(chunk.endsWith('9'))?'9':''
        return chunk
    }
    private read(chunk:string):number[] {
        let originalArray = []
        chunk.startsWith('9')?originalArray.push(0):''//since 9 is a delimeter,it only appears first if there was a zero before it.
        originalArray = [...chunk.split('9').map((element)=>base9ToDecimal(element))]
        return originalArray
    }
    private returnUncompressedArray():(number | string)[] {
        let originalArray:(number | string)[] = (this.isCompressed)?this.read(this.dechunk()):this.array
        if (this.isCompressed) {
            originalArray = originalArray.slice(0,originalArray.length-1)//to remove the trailing zero
        }
        return originalArray
    }
    public async push(num:number){
        this.decompress();
        this.array.push(num);
        return (async ()=>'')().then(()=>this.compress_safely());
    }
    public at(index:number):number | undefined {
        const element = this.returnUncompressedArray().at(index)
        return Number(element)
    }       
}
const scores = new Tiny()
scores.data = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150]//Here is 120 bytes
scores.data.then(()=>{//Here is only 32 bytes to send over a network.It removes the need entirely of streamong data or at least reduce the amount of packets to be sent over a network
    //Server side for example--sent the compressed data
    console.log('Sent the compressed data: ',scores.state);//use this over the returned value as it doesnt copy the array

    //Client side for example--receiving the compressed data
    console.log('Scores',scores.state);
    const receiver = new Tiny()
    receiver.compressed_data = scores.state
    console.log('Received the compressed data and created the compressed object',receiver);
})
console.log('is compressed now: ',scores.state,await scores.data)
//But it reduces the amount of space needed to allocate for the array and it reduces the amount of data that is sent over the network


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

//*i also had to provide an abstraction for setting the data.This is because setting the data to a value should always set iscompressed to false so that the next call to compress should always compress it back but is compressed shouldnt be directly modified by the user of the class,so a setter is used an abstraction over this which forced me to implement a getter as the class variable couldnt have the same name as the setter.

//*There is a base 64 optimization where the last chunk will be optimized by 2-6 bytes.With the base 64 optimization,the best case scenario for my algorithm is 2bytes

//todo:can use negative to indicate that the chunk on the left is the same on the right

//*The algorithm can now compress all non zero integers even if the number of elements in the array is just one because of the addition of base 64 that reduces the size of a number to save 2-6 bytes
//*Type conversion is safer than type assertion

//*news flash.The array will not be compressed when calling the at method.It will defer compression till you use the data.Even when you use the data,it wont compress synchronously but rather,it will return a promise that it will compress so that it doesnt block the main thread and you only compress it later when you really need to use the data.This is to optimize as much time as possible so that compression doesnt waste time and it only happens when you need it to be compressed.This is a double defer of when compression will be done.You can also use await on it,so that it compresses as soon as you use the data.It will also compress implicitly when you call a write operation like push which always recompresses the data after writing to ensure that the data will always remain in a compressed form unless you use the skip compression method which returns the array as it is for you to perform write operations without recompressing on each write till you call the compress method explicitly which essentially batches the write operations and then compress later.

//*There is floor division,ceiling division,normal division,round division
//*My algorithm is only for non negative arrays and its optimized for js number representation.

//*So my array class is a non negative integer array but supercharged with compression management

//*standard if statements,one liner if statements

//*You can use deno,swc copiler or tsc compiler with ts

//*if the number of digits of the range is smaller than the number of digits in the other number
//!i need to know when to take opportunities and not

