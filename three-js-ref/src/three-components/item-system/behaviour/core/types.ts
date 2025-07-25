import * as THREE from "three";
import type { EntityLike } from "../../../entity-system/relationships.three";

//it doesnt matter if the dimensions of the model matches the one you define here because the game will automatically scale the model to fit into the rigid body.so you can comfortably rely on this config to properly sync the model with its physics body
interface RigidBodyCloneProps {
    density:number,
    width:number,//the width of the rigid body
    height:number,//the height of the rigid body
    depth:number,//the depth of the rigid body
    durability:number
}
export interface CloneArgs {
    model: THREE.Group,
    spawnPosition:THREE.Vector3,
    spawnQuaternion:THREE.Quaternion,
    properties:RigidBodyCloneProps,
    spinVectorInAir:THREE.Vector3,
    canPickUp:boolean,
    owner:EntityLike | null//to know the entity that spawned the clone to indicate ownersjip.it can be used to form relationships like the entity A threw an item at entity B.Null means no owner like the ones spawned naturally
    itemID:ItemID//i added this so that i can know the item that created this clone.its required to implement item pickup so that i can which item im adding back to the inventory.
    parent:THREE.Group//i made the parent group explicit so that callers can decide if they want to add it to the scene themselves for management.an example of this is my content distributions in my chunk.their meshes should be handled by the chunk loader.so this is a case where this applies
}

export interface PlaceableItemConfig extends RigidBodyCloneProps {
    modelPath:string,
    spawnDistance:number,
    showPlacementHelper:boolean,
    canPickUp:boolean,
}


export type ItemID = string;

//even if not every behaviour will require all of these variables,its still best to have all of them strictly required.this is to improve safety and predictability by removing null checks because its alwyas certain that they are provided and also,behaviours can choose to not destructure what they dont need
export interface ItemUsageDependecies {//the parameters here are variables that should always be supplied whenever the behaviour class needs them because they change continuously as the game runs
    view:THREE.Group,
    itemID:string,
    owner:EntityLike//it must be a valid owner here unlike in clone args where it can be nulll because for an item to be used,someone must have owned it
    userStrength:number,
    userHorizontalQuaternion:THREE.Quaternion
}
export interface ItemBehaviour {
    use:(args:ItemUsageDependecies)=>void,
    placeableConfig?:PlaceableItemConfig//not all item behaviours will need to be placed in the world like a sword
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