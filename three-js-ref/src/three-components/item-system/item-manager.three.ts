import * as THREE from "three";

export type ItemID = string;

export interface Item {
    readonly name: string,          // friendly name
    readonly modelPath: string,   // path to model file
    readonly imagePath: string,    // path to model file
    scene:THREE.Group | null,//holds a ref to the gltf model
    transform:ItemPlacement
}
export interface InventoryItem {
    count:number,
    item:Item
}
export interface ItemPlacement {
    position:THREE.Vector3,
    rotation:THREE.Euler,
    scale:THREE.Vector3
}
function eulerDegToRad(euler: THREE.Euler): THREE.Euler {
    return new THREE.Euler(
        THREE.MathUtils.degToRad(euler.x),
        THREE.MathUtils.degToRad(euler.y),
        THREE.MathUtils.degToRad(euler.z),
        euler.order // preserve the order
    );
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
            modelPath:'./block/block.glb',
            imagePath:'./block/block.png',
            scene:null,
            transform:{
                position:new THREE.Vector3(0,-0.2,0), 
                rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
                scale:new THREE.Vector3(0.5,0.5,0.5)
            }
        },
        'snowball':{
            name:'Snowball',
            modelPath:'./snowball/snowball.glb',
            imagePath:'./snowball/snowball.png',
            scene:null,
            transform:{
                position:new THREE.Vector3(0,0,0), 
                rotation:eulerDegToRad(new THREE.Euler(0,0,0)),
                scale:new THREE.Vector3(0.5,0.5,0.5)
            }
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