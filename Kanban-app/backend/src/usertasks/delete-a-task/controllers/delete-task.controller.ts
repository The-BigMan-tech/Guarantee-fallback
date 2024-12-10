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
        const unsafeMessage:string | void = await this.allCheckService.checkForAll(task.boardName,task.groupName,'',true,task.index)
        if (unsafeMessage === 'board not found' || 'group not found' || 'task not found') {
            tag = 'UNSAFE'
        }else if (unsafeMessage === 'board not found') {
            message = `The board,'${task.boardName}' doesnt exist to perform the delete operation`
            return `${tag}:${message}`
        }else if (unsafeMessage === 'group not found') {
            message = `The group,'${task.groupName}' doesnt exist to perform the delete operation`
            return `${tag}:${message}`
        }else if (unsafeMessage === 'task not found') {
            message = `The board,'${task.boardName}' doesnt exist to perform the delete operation`
            return `${tag}:${message}`
        }

        await this.deleteTaskService.deleteTask(task.boardName,task.groupName,task.index);
        const taskTitle = unsafeMessage
        tag = 'SUCCESSFUL';
        message = `Deleted the task '${taskTitle}' from the group '${task.groupName}' from the board '${task.boardName}'`
        return `${tag}:${message}`
    }
}