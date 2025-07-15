interface ItemData {
    name: string;          // friendly name
    modelPath: string;     // path to model file
}
type ItemID = string;
type Singleton<T> = T;

class ItemRegistry {
    private static registry:ItemRegistry;
    private _items:Readonly<Record<ItemID,ItemData>> = Object.freeze({//items should be registered on startup and shouldn be mutated
        'block':{
            name:'Block',
            modelPath:'./block.glb'
        }
    })

    private constructor() {}
    public static get instance() {
        if (!ItemRegistry.registry) {
            ItemRegistry.registry = new ItemRegistry();
        }
        return ItemRegistry.registry
    }

    get items():Record<ItemID,ItemData> {
        return this._items
    }
}
export const itemRegistry:Singleton<ItemRegistry> = ItemRegistry.instance;