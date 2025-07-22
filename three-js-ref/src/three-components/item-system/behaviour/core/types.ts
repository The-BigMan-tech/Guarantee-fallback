import * as THREE from "three";

interface ItemCloneProps {
    density:number,
    width:number,
    height:number,
    depth:number,
    durability:number
}
export interface CloneArgs {
    model: THREE.Group,
    spawnPosition:THREE.Vector3,
    spawnQuaternion:THREE.Quaternion,
    properties:ItemCloneProps,
    spinVectorInAir:THREE.Vector3,
}

export interface ItemBody extends ItemCloneProps {
    modelPath:string,
    spawnDistance:number,
    showPlacementHelper:boolean
}


export type ItemID = string;

export interface UseItemDependecies {//the parameters here are variables that should always be supplied whenever the behaviour class needs them because they change continuously as the game runs
    view:THREE.Group,
    itemID:string,
    userStrength:number,
    userQuaternion:THREE.Quaternion
}
export interface ItemBehaviour {
    use:(args:UseItemDependecies)=>void,
    itemBody?:ItemBody//not all item behaviours will need to be placed in the world like a sword
}

interface ItemTransformInHand {
    position:THREE.Vector3,
    rotation:THREE.Euler,
    scale:THREE.Vector3
}
export interface Item {
    readonly name: string,//name of the item to be displayed in the gui
    readonly modelPath: string,// path to model file to display in the hand
    readonly imagePath: string,// path to image file to display in the gui
    scene:THREE.Group | null,//holds a ref to the gltf model.its gotten from the model path to display it in the hand
    transformInHand:ItemTransformInHand,//states how the transform of the item in the character's hand
    behaviour:ItemBehaviour//this is a class attatched to an item definition to give it behaviour like a throwable item,a placeable block,etc
}