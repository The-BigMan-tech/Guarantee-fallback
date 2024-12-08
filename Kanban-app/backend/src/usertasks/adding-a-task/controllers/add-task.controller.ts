import { Controller,Post,Body,Delete,Query} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { AddTaskService} from "../services/add-task.service";

interface TaskLocation {
    boardName:string,
    taskInfo:TaskDTO
}
interface DeleteInfo {
    boardName:string,
    groupName:string,
    title:string
}
@Controller('boards/addTask')
export class TaskController {
    constructor(private readonly addTaskService:AddTaskService) {
        //No implementation
    }
    @Post()
    public async addTaskControl(@Body() task:TaskLocation):Promise<string> {
        await this.addTaskService.addTask(task.boardName,task.taskInfo.status,task.taskInfo);
        return `ADDED THE TASK ${task.taskInfo.title} TO THE GROUP ${task.taskInfo.status} OF THE BOARD ${task.boardName}`
    }
    @Delete('/delete')
    public async deleteTaskControl(@Query() task:DeleteInfo):Promise<string> {
        await this.addTaskService.deleteTask(task.boardName,task.groupName,task.title)
        return `DELETED THE TASK ${task.title} FROM THE GROUP ${task.groupName} FOR THE BOARD ${task.boardName}`
    }
}