export class UniqueList<T> {
    public set: Set<T>; // Hash Set for uniqueness
    public list: T[];   // Dynamic Array to access last element
    private indexMap: Map<T, number>;//a map to keep track of indexes for efficient deleteion

    constructor(init?:T[]) {
        this.set = new Set();
        this.list = [];
        this.indexMap = new Map();
        if (init) {
            for (const element of init) {
                this.add(element);
            }
        }
    }
    // Add an element
    public add(element: T): boolean {//adds an element to this structure only if it doesnt exist at O(1) time
        if (!this.set.has(element)) {
            this.set.add(element);
            this.list.push(element);
            this.indexMap.set(element, this.list.length-1);
            return true; // Element was added
        }
        return false; // Element already exists
    }

    // Delete an element
    public delete(element: T): boolean {//deleted an element from the structure at O(1) time by using the swap and pop deletion method through the utilization of the map
        if (this.set.has(element)) {
            this.set.delete(element);
            const index = this.indexMap.get(element)!; // Get index in O(1)
            const lastElement = this.list[this.list.length - 1];
            this.list[index] = lastElement; // Move last element to the deleted spot
            this.indexMap.set(lastElement, index); // Update index map
            
            this.list.pop(); // Remove the last element
            this.indexMap.delete(element); // Remove from index map
            return true; // Element was deleted
        }
        return false; // Element does not exist
    }
}
