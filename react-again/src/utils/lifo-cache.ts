export class LifoCache<K, V> {
    private max: number;
    private map: Map<K, V>;
    private stack: K[];

    public onSet?: (key: K, value: V) => boolean | void;
    public onEvict?: (key: K, value: V) => void;

    constructor(options: { max: number }) {
        this.max = options.max;
        this.map = new Map();
        this.stack = [];
    }
    get(key: K): V | undefined {
        return this.map.get(key);
    }
    has(key: K): boolean {
        return this.map.has(key);
    }
    set(key: K, value: V): this {
        if (this.onSet) {
            const shouldCache = this.onSet(key, value);
            if (shouldCache === false) {
                return this;// Skip caching this entry
            }
        }
        if (this.map.has(key)) {
            // Update existing value, no eviction or stack change
            this.map.set(key, value);
            return this;
        }
        if (this.map.size >= this.max) {
            // Evict the most recently added item (top of the stack)
            const lastKey = this.stack.pop();
            if (lastKey !== undefined) {
                const evictedValue = this.map.get(lastKey)!;
                if (this.onEvict) {
                    this.onEvict(lastKey, evictedValue);
                }
                this.map.delete(lastKey);
            }
        }
        this.map.set(key, value);
        this.stack.push(key);
        return this;
    }
    delete(key: K): boolean {
        if (!this.map.has(key)) return false;
        this.map.delete(key);
        const index = this.stack.indexOf(key);
        if (index !== -1) this.stack.splice(index, 1);
        return true;
    }
    clear(): void {
        this.map.clear();
        this.stack = [];
    }
    get size(): number {
        return this.map.size;
    }
}