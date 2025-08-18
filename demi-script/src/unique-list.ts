export class UniqueList<T> {
    private _set: Set<T>; // Hash Set for uniqueness
    private array: T[];   // Dynamic Array to access last element
    private indexMap: Map<T, number>;//a map to keep track of indexes for efficient deleteion

    constructor(init?:T[]) {
        this._set = new Set();
        this.array = [];
        this.indexMap = new Map();
        if (init) {
            for (const element of init) {
                this.add(element);
            }
        }
    }
    // Add an element
    public add(element: T): boolean {//adds an element to this structure only if it doesnt exist at O(1) time
        if (!this._set.has(element)) {
            this._set.add(element);
            this.array.push(element);
            this.indexMap.set(element, this.array.length-1);
            return true; // Element was added
        }
        return false; // Element already exists
    }

    // Delete an element
    public delete(element: T): boolean {//deleted an element from the structure at O(1) time by using the swap and pop deletion method through the utilization of the map
        if (this._set.has(element)) {
            this._set.delete(element);
            const index = this.indexMap.get(element)!; // Get index in O(1)
            const lastElement = this.array[this.array.length - 1];
            this.array[index] = lastElement; // Move last element to the deleted spot
            this.indexMap.set(lastElement, index); // Update index map
            
            this.array.pop(); // Remove the last element
            this.indexMap.delete(element); // Remove from index map
            return true; // Element was deleted
        }
        return false; // Element does not exist
    }
    public get list():T[] {
        return this.array;
    }
    public get set():Set<T> {
        return this._set;
    }
    public get length():number {
        return this.array.length;
    }
}
import { cartesianProduct } from "combinatorial-generators";

const input = [[':ada',':mike'], [':zane',':peter',':jane',['h','j']]];

function flattenRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
    for (const product of cartesianProduct(...input)) {
        if (product.some(value=>value instanceof Array)) {
            const boxedProduct = product.map(value=>{
                if (!(value instanceof Array)) {
                    return [value];
                }
                return value;
            });
            flattenRecursively(boxedProduct,flatSequences);
        }else {
            flatSequences.push(product);
        }
    } 
    return flatSequences;
}
console.log(flattenRecursively(input));