type ItemID = string;

interface Item {
    readonly name: string;          // friendly name
    readonly modelPath: string;     // path to model file
}
interface InventoryItem {
    count:number,
    item:Item
}
interface IdentityInventoryItem {
    readonly id:ItemID,
    readonly invItem:InventoryItem
}
function deepFreeze<T extends object>(obj: T): T {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const value = obj[prop as keyof T];
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return Object.freeze(obj);
}

type Singleton<T> = T;
class ItemManager {
    private static manager:ItemManager;

    private inventory:Map<ItemID,InventoryItem> = new Map();
    private _items:Readonly<Record<ItemID,Item>> = deepFreeze({//items should be registered on startup and shouldn be mutated
        'block':{
            name:'Block',
            modelPath:'./block.glb'
        }
    })

    private constructor() {}
    public static get instance() {
        if (!ItemManager.manager) {
            ItemManager.manager = new ItemManager();
        }
        return ItemManager.manager
    }
    public get items():Record<ItemID,Item> {
        return this._items
    }
    private validateID(itemID:ItemID) {
        if (!this._items[itemID]) {
            throw new Error(`Item ID '${itemID}' is not registered.`);
        }
    }
    public addToInventory(itemID:ItemID) {
        this.validateID(itemID);
        const item = this.inventory.get(itemID);
        if (!item) {
            this.inventory.set(itemID, {item:this._items[itemID],count:1 })
        }else {
            item.count ++//the counter is an internal increment.items are added one at a time not in stacks
        }
    }
    public removeFromInventory(itemID:ItemID) {
        this.validateID(itemID);
        const item = this.inventory.get(itemID);
        if (item) {
            item.count --;
            if (item.count <= 0) {
                this.inventory.delete(itemID);
            }
        }
    }
    public getInventoryItems():ReadonlyArray<IdentityInventoryItem> {
        const entries = Array.from(this.inventory.entries());
        return entries.map( ([id, invItem]) => deepFreeze({id,invItem}) )
    }
    
}
export const itemManager:Singleton<ItemManager> = ItemManager.instance;