import { TaskDTO } from "src/usertasks/dto/task.dto";
import { IsString,IsNotEmpty } from "class-validator";


export class GroupDTO {
    name:string;
    tasks:TaskDTO[]
}
export class GroupInfoDTO {
    @IsString()
    @IsNotEmpty()
    boardName:string;
    
    @IsString()
    @IsNotEmpty()
    groupName:string
}
export class EditGroupDTO {
    @IsString()
    @IsNotEmpty()
    boardName:string;

    @IsString()
    @IsNotEmpty()
    oldGroupName:string;

    @IsString()
    @IsNotEmpty()
    newGroupName:string;
}