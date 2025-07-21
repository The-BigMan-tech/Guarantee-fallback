export interface ItemCloneProps {
    density:number,
    width:number,
    height:number,
    depth:number
}
export interface ItemBody extends ItemCloneProps {
    modelPath:string
}