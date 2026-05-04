//i made this deque because the denque pkg doesnt allow mutation at any arbitrary index but only efficient O1 queu operations.
//This structure helps to solve that by using a headspaced array implementation for efficient 01 queue operations while still supporting O1 arbitary mutation
//But it has inferequent O(n) operations at certain conditions and it doesnt save memory as the circular buffer dequeu which is used in denque
//it is not used in this project but will be in the future.


export class QList<T> {
    private arr:(T | undefined)[] = [];
    private compactionFraction:number = 0.40;//a weight between 0 and 1
    private initHeadSpace:number = 5;
    private start:number = this.initHeadSpace;

    constructor(init?:T[]) {
        this.allocateHeadSpace(this.initHeadSpace);
        if (init) {
            for (const element of init) {
                this.push(element);
            }
        }
    }

    public push(element:T):void {//O1
        this.arr.push(element);
    }
    public pop():T | undefined {//O1
        if (this.arr.length === this.start) return undefined;
        return this.arr.pop() as T;
    }
    public shift():T | undefined {//O1 with infrequent O(n)
        if (this.start >= this.arr.length) return undefined;
        const value = this.arr[this.start];
        this.arr[this.start] = undefined; // Help garbage collector
        this.start++;
        this.compactIfLarge();
        return value;
    }
    public unshift(element:T):void {//O(1) with infrequent O(n) thanks to allocating the size of the array
        if (this.start === 0) {
            this.allocateHeadSpace(this.arr.length);
            this.insert(element);
        }else {
            this.insert(element);
        }
    }

    public get(i:number):T | undefined {//O1
        if ((i < 0) || (i >= this.length)) return undefined;
        const index = this.start + i;
        return this.arr[index] as T;
    }
    public set(i:number,element:T):boolean {//O1
        if ((i < 0) || (i >= this.length)) return false;
        const index = this.start + i;
        this.arr[index] = element;
        return true;
    }

    public array():T[] {//O(n)
        return this.arr.slice(this.start) as T[];//by returning a slice,we ensure that they dont mutate the internal array
    }
    public get length():number {//O1
        return this.arr.length - this.start;
    }
    public clear():void {//rather than clearing the array which will lead to future allocations if reused,we just set everything to undefined and shift the start pointer
        for (let i=0; i < this.arr.length; i++ ) {
            this.arr[i] = undefined;
        }
        this.start = this.arr.length;
    }

    private insert(element:T):void {
        this.start--;
        this.arr[this.start] = element;
    }
    private allocateHeadSpace(size:number):void {//O(n)
        const newArr = new Array(size + this.arr.length);
        for (let i=0; i < this.arr.length; i++ ) {
            newArr[size + i] = this.arr[i];
        }
        this.arr = newArr;
        this.start += size;
    }
    private compactIfLarge():void {//O(n)
        const reachedThreshold = (this.start / this.arr.length) >= this.compactionFraction;
        if ((this.start > 0) && reachedThreshold) {
            this.arr = this.arr.slice(this.start);
            this.start = 0;
        }
    }
}
