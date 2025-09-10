export class CustomQueue<T> {
    private arr:(T | undefined)[];
    private start:number;
    private compactionFraction:number = 0.25;//a weight between 0 and 1

    constructor(init?:T[]) {
        this.arr = [];
        this.start = 0;
        if (init) {
            for (const element of init) {
                this.push(element);
            }
        }
    }
    public push(element:T):void {
        this.arr.push(element);
    }
    public pop():T | undefined {
        if (this.arr.length === this.start) return undefined;
        return this.arr.pop() as T;
    }
    public shift():T | undefined {
        if (this.start >= this.arr.length) return undefined;
        const value = this.arr[this.start];
        this.arr[this.start] = undefined; // Help garbage collector
        this.start++;
        this.compactIfLarge();
        return value;
    }
    public unshift(element:T):void {
        if (this.start === 0) {
            this.arr.unshift(element);
        } else {
            this.start--;
            this.arr[this.start] = element;
        }
    }
    public get(i:number):T | undefined {
        const index = this.start + i;
        if ((index >= this.arr.length) || (index < this.start)) return undefined;
        return this.arr[index] as T;
    }
    public set(i:number,element:T):boolean {
        const index = this.start + i;
        if ((index >= this.arr.length) || (index < this.start)) return false;
        this.arr[index] = element;
        return true;
    }
    public array():T[] {
        return this.arr.slice(this.start) as T[];
    }
    public length():number {
        return this.arr.length - this.start;
    }
    private compactIfLarge():void {
        const reachedThreshold = (this.start / this.arr.length) >= this.compactionFraction;
        if ((this.start > 0) && reachedThreshold) {
            console.log('reached thresh');
            this.arr = this.arr.slice(this.start);
            this.start = 0;
        }
    }
}
