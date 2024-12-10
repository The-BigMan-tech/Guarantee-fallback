import { Controller,Post,Body,UsePipes} from "@nestjs/common";
import { TaskDetailsDTO } from "src/usertasks/dto/task.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { allCheckService } from "src/usertasks/common-services/services/common-services.service";
import { AddTaskService } from "../services/add-task.service";

@Controller('tasks/addTask')
export class AddTaskControl {
    constructor(
        private readonly allCheckService:allCheckService,
        private readonly addTaskService:AddTaskService
    ) {

    }
    @Post()
    @UsePipes(new RequestSafetyPipe())
    public async addTaskControl(@Body() task:TaskDetailsDTO):Promise<string> {
        let tag:string;
        let message:string;
        const warningMessage:string | string[] = await this.allCheckService.checkOperationSafety('add',task.boardName,task.taskInfo.status)
        if (!Array.isArray(warningMessage)) {
            return warningMessage
        }
        await this.addTaskService.addTask(task.boardName,task.taskInfo.status,task.taskInfo);
        tag = 'SUCCESSFUL'
        message = `Added the task '${task.taskInfo.title}' to the group '${task.taskInfo.status}' to the board '${task.boardName}'`
        return `${tag}:${message}`
    }
}