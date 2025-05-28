export class LifoCache<K, V> {
    private max: number;
    private map: Map<K, V>;
    private stack: K[];

    public onSet?: (key: K, value: V) => boolean;
    public onEvict?: (key: K, value: V) => Promise<void>;
    public onGet?:(key:K,value:V | undefined)=>Promise<V | undefined>;//if i passed the key and return the value of the key in the hook using this object,it may be in an infinite loop cuz this.onegt will always be defined
    public onFull?:(cache:LifoCache<K,V>)=>Promise<void>;

    constructor(options: { max: number }) {
        this.max = options.max;
        this.map = new Map();
        this.stack = [];
    }
    async get(key: K):Promise<V | undefined> {
        const value = this.map.get(key)
        if (this.onGet) {
            return await this.onGet(key,value)//the key is not meant to be used by the interceptor to return the value to prevent recursion
        }
        return value;
    }
    has(key: K): boolean {
        return this.map.has(key);
    }
    async set(key: K, value: V):Promise<this> {
        if (this.onSet) {
            const shouldCache = this.onSet(key, value);
            if (shouldCache === false) {
                return this;// Skip caching this entry
            }
        }
        if (this.map.has(key)) { // Update existing value, no eviction or stack change
            this.map.set(key, value);
            return this;
        }
        if (this.map.size >= this.max) {
            if (this.onFull) {
                await this.onFull(this);
            }
            const lastKey = this.stack.pop();//Evict the most recently added item (top of the stack)
            if (lastKey !== undefined) {
                const evictedValue = this.map.get(lastKey)!;
                if (this.onEvict) {
                    await this.onEvict(lastKey, evictedValue);
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
        this.stack.length = 0;
    }
    get size(): number {
        return this.map.size;
    }
}