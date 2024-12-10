import { Controller,UsePipes,Delete,Query} from "@nestjs/common";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { allCheckService } from "src/usertasks/common-services/services/common-services.service";
import { DeleteTaskService } from "../services/delete-task.service";
import { GeneralDetailsDTO } from "src/usertasks/dto/task.dto";

@Controller('tasks/deleteTask')
export class DeleteTaskControl {
    constructor(
        private readonly allCheckService:allCheckService,
        private readonly deleteTaskService:DeleteTaskService
    ) {

    }
    @Delete()
    @UsePipes(new RequestSafetyPipe())
    public async deleteTaskControl(@Query() task:GeneralDetailsDTO):Promise<string> {
        let tag:string;
        let message:string;
        const warningMessage:string | string[] = await this.allCheckService.checkOperationSafety('delete',task.boardName,task.groupName,true,task.index)
        if (!Array.isArray(warningMessage)) {
            return warningMessage 
        }
        let taskTitle = warningMessage[1]
        await this.deleteTaskService.deleteTask(task.boardName,task.groupName,task.index);
        tag = 'SUCCESSFUL';
        message = `Deleted the task '${taskTitle}' from the group '${task.groupName}' from the board '${task.boardName}'`
        return `${tag}:${message}`;
    }
}