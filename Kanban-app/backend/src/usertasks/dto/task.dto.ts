export class TaskDTO {
    title:string;
    description:string;
    subtasks:string;
    status:string
}
export class TaskDetailsDTO {
    boardName:string;
    taskInfo:TaskDTO
}
//*The possibility of two tasks having the same title brings up the use of its index for precision
export class GeneralDetailsDTO {
    boardName:string;
    groupName:string;
    index:number
}
export class DeleteTaskDTO extends GeneralDetailsDTO{
    title:string;
}
export class EditTaskDTO extends GeneralDetailsDTO {
    newTask:TaskDTO
}