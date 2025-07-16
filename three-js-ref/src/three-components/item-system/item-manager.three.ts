interface ItemData {
    name: string;          // friendly name
    modelPath: string;     // path to model file
}
type ItemID = string;
type Singleton<T> = T;

class ItemManager {
    private static manager:ItemManager;
    private _items:Readonly<Record<ItemID,ItemData>> = Object.freeze({//items should be registered on startup and shouldn be mutated
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

    get items():Record<ItemID,ItemData> {
        return this._items
    }
}
export const itemManager:Singleton<ItemManager> = ItemManager.instance;