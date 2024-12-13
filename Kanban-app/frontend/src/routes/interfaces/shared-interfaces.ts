export interface TaskDTO {
    title:string,
    description:string,
    subtasks?:string,
    status:string,
}
export interface TaskDetailsDTO {
    boardName:string;
    taskInfo:TaskDTO
}
export interface GroupDTO {
    name:string,
    tasks:TaskDTO
}
export interface BoardDefinition {
    name:string,
    groups:GroupDTO[]
}