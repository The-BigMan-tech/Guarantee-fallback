//!The notes i wrote below might be countered by preceeding notes because the notes i wrote were in the course of the algorithm's growth over time and as such,the latter ones might contradict some previous ones and if it does,its more accurate to stick to that.
import chalk from 'chalk'

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
export class Small32 {
    private name:string = ''
    private log;
    private array:Int32Array | number[] = new Int32Array([]);
    private isCompressed:boolean = false;
    constructor(array_name:string,shouldLog:boolean=false) {
        this.name = chalk.cyan(array_name);
        this.log = (shouldLog)?console.log:()=>{}
    }
    get is_compressed():boolean {
        return this.isCompressed
    }
    get state():Int32Array | number[] {//*returns the current state of the array whether compressed or uncompressed
        return this.array
    }
    //use this if you want to send the array over a network only if its compressed.
    get data():Promise<Int32Array | string> {
        return (async ()=> this.log(`${chalk.blue('Notice:')}The array: \'${this.name}\' has been promised to compress later`))
            ().then(()=>{
                this.compress_safely()
                if (this.array instanceof Int32Array) {
                    return this.array;
                }
                return `${chalk.blue('Notice:')}The array: \'${this.name}\' did not benefit from the compression`;
            }
        );   
    }
    set data(newArray:Int32Array | number[]) {
        this.array = newArray
        this.isCompressed = false
    }
    set compressed_data(newArray:Int32Array) {
        this.array = newArray
        this.isCompressed = true
    }
    public compress():void  {//?why not make this not compress safely over creating a separate method for that.the reason is because i just feelit is better for it to be designed that way
        if (this.isCompressed) {
            throw new Error(`${chalk.red('Red flag:')}Refused to compress the array: \'${this.name}\' because it\'s already compressed`);
        }
        this.log(`${chalk.magenta('Pending:')}The array: \'${this.name}\' is under compression`);
        let chunk:string = ''
        let negativeChunk:string = ''
        this.array.forEach((num,index)=>{
            negativeChunk += (num < 0)?`${decimalToBase9(index)}9`:'';
            chunk += `${decimalToBase9(Math.abs(num)).toString()}9`
        });
        let range = chunk.length 
        let negRange = negativeChunk.length

        range -= (chunk.startsWith('09'))?1:0;
        negRange -= (negativeChunk.startsWith('09'))?1:0;

        const maxChunkSize = 9
        const lengthOfCompressedArray = Math.ceil(range/maxChunkSize) + Math.ceil(negRange/maxChunkSize);;
        // console.log('tiny.ts:78 => Tiny => compress => lengthOfCompressedArray:', lengthOfCompressedArray);
        const sizeOfCompressed32Array = lengthOfCompressedArray * 4
        const sizeofUncompressedArray = this.array.length * 8
        if (sizeOfCompressed32Array < sizeofUncompressedArray) {
            let chunks:string[] = []
            let negChunks:string[] = []
            for (let i = 0;i < range;i+=maxChunkSize) {
                const smallerChunk:string = chunk.slice(i,i+maxChunkSize)
                chunks.push(smallerChunk)
            }
            for (let i = 0;i < negRange;i+=maxChunkSize) {
                const smallerNegChunk:string = `-${negativeChunk.slice(i,i+maxChunkSize)}`
                negChunks.push(smallerNegChunk)
            }
            chunks = chunks.filter(element=>element !== '9')
            const last = chunks.at(-1)
            if (last && (last.endsWith('9'))) {
                chunks[chunks.length-1] = last.slice(0,last.length - 1)
            }
            let chunksAsNumbers:number[] = [...chunks.map(Number),...negChunks.map(Number)]
            this.array = new Int32Array(chunksAsNumbers)
            this.isCompressed = true
            this.log(`${chalk.green('Success:')}The array: \'${this.name}\' has compressed successfully`);
            return
        }
        this.log(`${chalk.blue('Notice:')}Refused to compress the array: \'${this.name}\' because it wont benefit from the compression`);
    }
    //use this over normal compress method
    public compress_safely():void {//will only call compress if it isnt compressed and as such,it wont throw an error if you attempt to compress the array if its already compressed
        if (!(this.isCompressed)){
            this.compress();
        }else {
            this.log(`${chalk.blue('Notice:')}The array: \'${this.name}\' is already compressed`);
        }
    }
    public decompress():void {
        let wasCompressed = false
        if (this.isCompressed) {
            this.log(`${chalk.magenta('Pending:')}The array: \'${this.name}\' is under decompression`);
            wasCompressed = true
        }else {
            this.log(`${chalk.blue('Notice:')}The array: \'${this.name}\' is already decompressed`);
        }
        this.data = this.returnUncompressedArray();//The setter will automatically convert is compressed to false
        if (wasCompressed) {
            this.log(`${chalk.green('Success:')}The array: \'${this.name}\' has decompressed successfully`);
        }
    }
    public skipCompression() {
        return (this.isCompressed==false)?this.array:(() => {this.log(`${chalk.red('Red flag:')}The array: \'${this.name}\' is already compressed so you can\'t skip the process`) })();
    }
    private dechunk():string[] {
        let chunk:string[] = ['','']
        this.array.forEach(num=>{
            if (num > 0) {
                chunk[0] += num.toString()
            }else {
                chunk[1] += (Math.abs(num)).toString()
            }
        })
        if (!(chunk[1].startsWith('9')) && chunk[1].endsWith('9')) {
            chunk[1] = chunk[1].slice(0,chunk[1].length-1)
        }
        // chunk[0] += !(chunk[0].endsWith('9'))?'9':'';👈
        if (!(chunk[1])) {
            chunk = [chunk[0]]
        }
        return chunk
    }
    private read(chunk:string[]):number[] {
        let originalArray = []
        chunk[0].startsWith('9')?originalArray.push(0):''//since 9 is a delimeter,it only appears first if there was a zero before it.
        originalArray = [...chunk[0].split('9').map((element)=>base9ToDecimal(element))]
        let negIndices = new Set(chunk[1]?[...chunk[1].split('9').map((element)=>base9ToDecimal(element))]:[])
        // console.log('tiny.ts:152 => Tiny => read => negIndices:', negIndices);
        originalArray = originalArray.map((num,index)=>(negIndices.has(index))?(num * -1):num)
        // console.log('tiny.ts:153 => Tiny => read => originalArray:', originalArray);
        return originalArray
    }
    private returnUncompressedArray():number[] {
        let originalArray:number[] = (this.isCompressed)?this.read(this.dechunk()):[...this.array]
        return originalArray
    }
    public async push(num:number){
        this.log(`${chalk.blue('Notice:')}The array: \'${this.name}\' will be decompressed before pushing`);
        this.decompress();
        this.log(`${chalk.blue('Notice:')}The array: \'${this.name}\' is prepared for pushing`);
        const normalArray:number[] = [...this.array];
        normalArray.push(num);
        this.array = normalArray;
        return (async ()=>this.log(`${chalk.blue('Notice:')}Pushing was successful.The array: \'${this.name}\' has now been promised to compress`))()
            .then(()=>{this.compress_safely()}
        );
    }
    public at(index:number):number | undefined {
        const element = this.returnUncompressedArray().at(index)
        return Number(element)
    }       
}
//*when sending the compressed array over a network,send the this.state or await this.data in the response and then on the client side,create a new Tiny class object and set the compressed data setter to the array received over the network.This is to ensure that only the compressed array is received over the network and not the entire object 
//It reduces the amount of space needed to allocate for the array and the data that is required to be sent over the network

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
//*Type conversion and type guards are safer than type assertion

//*news flash.The array will not be compressed when calling the at method.It will defer compression till you use the data.Even when you use the data,it wont compress synchronously but rather,it will return a promise that it will compress so that it doesnt block the main thread and you only compress it later when you really need to use the data.This is to optimize as much time as possible so that compression doesnt waste time and it only happens when you need it to be compressed.This is a double defer of when compression will be done.You can also use await on it,so that it compresses as soon as you use the data.It will also compress implicitly when you call a write operation like push which always recompresses the data after writing to ensure that the data will always remain in a compressed form unless you use the skip compression method which returns the array as it is for you to perform write operations without recompressing on each write till you call the compress method explicitly which essentially batches the write operations and then compress later.

//*news flash:The push method no longer recompresses the array each time it pushes but rather it decompresses the array only once so that it can push to it but it will not compress the array back and instead,return a promise that it will compress the array back.So if you call push alone,it wont compress the array back and the array will only compress afterwards on the next call to this.data.Its like a defer thing.It will push everything first then compress it later or you can call push with await which will recompress the array every time it pushes.The first option prioritizes time while the second one prioritizes the memory output of the array.

//*news flash:I removed the base 64 optimization in favour of the int32 array optimization as int32 will only work for number arrays and arrays of numbers and strings as it is for base 64.That means that my chunk size had to be reduced from 15 bytes to 9 bytes and then converted tthe whole array to a 32 int array.I did a test on this and i was able to reduce the compressed array of a particular array from 32 to 28bytes.It squeezed extra 4 bytes out of it.So this also means im deleting the code for the base 64 optimization but its already recorded in the git history so i can always check it back later if i need to.With the int32 optimization,its almost a guarantee that the compressed array will always be smaller than the original array even if the array only has one element unlike the 64 opt.The only time the compressed array will be bigger is if an integer is too long that it creates many chunks but my algorithm will always check for cases like this before it compresses it.

//*There is floor division,ceiling division,normal division,round division
//*My algorithm is only for non negative arrays and its optimized for js number representation.

//*So my array class is a non negative integer array but supercharged with compression management

//*standard if statements,one liner if statements

//*You can use deno,swc copiler or tsc compiler with ts

//*if the number of digits of the range is smaller than the number of digits in the other number
//!i need to know when to take opportunities and not

