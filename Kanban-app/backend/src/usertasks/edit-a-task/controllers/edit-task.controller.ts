import { Controller,Post,Body,Delete,Query,Put} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { UsePipes } from "@nestjs/common";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { TaskDetailsDTO,EditTaskDTO} from "src/usertasks/dto/task.dto";
import { EditTaskService } from "../services/edit-task.service";
import { allCheckService } from "src/usertasks/common-services/services/common-services.service";

@Controller('tasks')
@UsePipes(new RequestSafetyPipe())
export class EditTaskController {
    constructor(
        private readonly editTaskService:EditTaskService,
        private readonly allCheckService:allCheckService
    ) {
        //No implementation
    }
    @Put('/editTask')
    public async editTaskControl(@Body() task:EditTaskDTO):Promise<string> {
        const warningMessage:string | string[] = await this.allCheckService.checkOperationSafety('edit',task.boardName,task.groupName)
        if (!Array.isArray(warningMessage)) {
            return warningMessage 
        }
        let taskTitle = warningMessage[1]
        await this.editTaskService.editTask(task.boardName,task.groupName,task.index,task.newTask);
        const tag = 'SUCESSFUL'
        const message = `Edited the task ${taskTitle} from the group ${task.groupName} from the board ${task.boardName}`
        return `${tag}:${message}`
    }
}