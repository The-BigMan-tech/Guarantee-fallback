import { IsEmpty, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TaskDTO {
    @IsString()
    @IsNotEmpty()
    title:string;

    @IsString()
    @IsOptional()
    description:string;

    @IsString()
    @IsOptional()
    subtasks:string;

    @IsString()
    @IsNotEmpty()
    status:string
}
export class FlexibleTaskDTO extends TaskDTO{
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    status: string;
}
export class TaskDetailsDTO {
    @IsString()
    @IsNotEmpty()
    boardName:string;

    @ValidateNested()
    @Type(()=>TaskDTO)
    taskInfo:TaskDTO
}
//*The possibility of two tasks having the same title brings up the use of its index for precision
export class GeneralDetailsDTO {
    @IsString()
    @IsNotEmpty()
    boardName:string;

    @IsString()
    @IsNotEmpty()
    groupName:string;

    index:number;
}
export class EditTaskDTO extends GeneralDetailsDTO {
    @ValidateNested()
    @Type(()=>FlexibleTaskDTO)
    newTask:FlexibleTaskDTO
}
export class EditIndexDTO extends GeneralDetailsDTO {
    newIndex:number
    direction:string
}