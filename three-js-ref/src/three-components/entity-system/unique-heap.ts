import Heap from "heap-js";

export class UniqueHeap<T> {
    private set:Set<T> = new Set();//used a set for O1 membership test
    private heap:Heap<T>;

    constructor(comparator:(a:T,b:T)=>number) {
        this.heap = new Heap(comparator)
    }
    public add(element:T):void {//this is O(logn) for the actual adding but the memebership test is O(1)
        if (!this.set.has(element)) {
            console.log('relationship added');
            this.set.add(element);
            this.heap.add(element)
        }
    }
    public remove(element:T):void {//this is O(logn) for removal but O(1) for memebership test
        if (this.set.has(element)) {
            console.log('relationship removed');
            this.set.delete(element);
            this.heap.remove(element)
        }
    }
    public top():T {//this is O(1)
        return this.heap.top()[0];
    }
    public bottom():T {
        return this.heap.bottom()[0];
    }
}