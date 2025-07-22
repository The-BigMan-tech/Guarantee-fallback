export interface ItemCloneProps {
    density:number,
    width:number,
    height:number,
    depth:number,
    durability:number
}
export interface ItemBody extends ItemCloneProps {
    modelPath:string,
    spawnDistance:number,
}