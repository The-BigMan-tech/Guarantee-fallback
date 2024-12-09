import { Controller,Post,Body,Delete,Query,Put} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { TaskOperationsService } from "../services/general-ops.service";
import { UsePipes } from "@nestjs/common";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { TaskDetailsDTO,DeleteTaskDTO,EditTaskDTO} from "src/usertasks/dto/task.dto";


@Controller('tasks')
@UsePipes(new RequestSafetyPipe())
export class TaskController {
    constructor(private readonly operationService:TaskOperationsService) {
        //No implementation
    }
    @Post('/addTask')
    public async addTaskControl(@Body() task:TaskDetailsDTO):Promise<string> {
        await this.operationService.addTask(task.boardName,task.taskInfo.status,task.taskInfo);
        return `ADDED THE TASK '${task.taskInfo.title}' TO THE GROUP '${task.taskInfo.status}' OF THE BOARD '${task.boardName}'`
    }

    @Delete('/deleteTask')
    public async deleteTaskControl(@Query() task:DeleteTaskDTO):Promise<string> {
        const result = await this.operationService.deleteTask(task.boardName,task.groupName,task.index,task.title);
        if (result === 'board not found') {
            return `BOARD NOT FOUND`
        }else if(result === 'group not found') {
            return `GROUP NOT FOUND`
        }else if (result === 'task not found') {
            return `COULD NOT DELETE THE TASK ${task.title} FROM THE GROUP ${task.groupName} FROM THE BOARD ${task.boardName} BECAUSE IT DOESNT EXIST AT THE INDEX YOU PROVIDED`
        }
        return `SUCCESSFULLY DELETED THE TASK ${task.title} FROM THE GROUP ${task.groupName} FROM THE BOARD ${task.boardName}`
    }

    @Put('/editTask')
    public async editTaskControl(@Body() task:EditTaskDTO):Promise<string> {
        const result = await this.operationService.editTask(task.boardName,task.groupName,task.index,task.newTask);
        if (result == 'board not found') {
            return `BOARD NOT FOUND`
        }else if (result === 'group not found') {
            return `GROUP NOT FOUND`
        }else if (result === `task not found`) {
            return `TASK NOT FOUND`
        }
        return `SUCCEEDED`
    }
}