import * as THREE from "three";

export type ItemID = string;

export interface Item {
    readonly name: string;          // friendly name
    readonly modelPath: string;     // path to model file
    readonly imagePath: string;     // path to model file
    scene:THREE.Group | null
}
export interface InventoryItem {
    count:number,
    item:Item
}

type Singleton<T> = T;
class ItemManager {
    private static manager:ItemManager;

    private _invSize:number = 8;
    private maxStackSize:number = 50;

    private _itemInHand:InventoryItem | null = null;//i used inv item type to keep track of its count to clear it when it reaches zero(no longer in the inventory)
    private _inventory:Map<ItemID,InventoryItem> = new Map();

    private _items:Record<ItemID,Item> = {//items should be registered on startup and shouldn be mutated
        'block':{
            name:'Block',
            modelPath:'./block.glb',
            imagePath:'./block.png',
            scene:null
        }
    }

    private constructor() {}
    public static get instance() {
        if (!ItemManager.manager) {
            ItemManager.manager = new ItemManager();
        }
        return ItemManager.manager
    }
    private validateID(itemID:ItemID) {
        if (!this._items[itemID]) {
            throw new Error(`Item ID '${itemID}' is not registered.`);
        }
    }
    public addToInventory(itemID:ItemID) {
        if (this.inventory.size < this._invSize) {//only add items when there is space
            this.validateID(itemID);
            const item = this._inventory.get(itemID);
            if (!item) {
                this._inventory.set(itemID, {item:this._items[itemID],count:1 })
            }else if (item.count < this.maxStackSize) {
                item.count ++
            }
        }
    }
    public removeFromInventory(itemID:ItemID) {
        this.validateID(itemID);
        const item = this._inventory.get(itemID);
        if (item) {
            item.count --;
            if (item.count <= 0) {
                this._inventory.delete(itemID);
                if (this._itemInHand && this._itemInHand?.count <= 0) {
                    this._itemInHand = null
                }
            }
        }
    }
    public get invSize():number {
        return this._invSize
    }
    public get inventory():ReadonlyMap<ItemID,InventoryItem> {
        return this._inventory;
    }
    public get items():Record<ItemID,Item> {
        return this._items
    }
    public get itemInHand():InventoryItem | null {
        return this._itemInHand
    }
    public isStackFull(itemID:ItemID):boolean {
        const item = this.inventory.get(itemID)
        return Boolean(item && (item.count == this.maxStackSize))
    }
    public holdItem(itemID:ItemID | null) {
        if ((itemID !== null) && this._items[itemID]) {
            this._itemInHand = this._inventory.get(itemID) || null;
        }else {
            this._itemInHand = null
        }
        console.log('holding item: ',this._itemInHand);
    }
}
export const itemManager:Singleton<ItemManager> = ItemManager.instance;