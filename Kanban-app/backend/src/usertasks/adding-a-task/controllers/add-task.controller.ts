import { Controller,Post,Body, Get,Query} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { AddTaskService} from "../services/add-task.service";

interface TaskLocation {
    boardName:string,
    taskInfo:TaskDTO
}
@Controller('boards/addTask')
export class AddTaskController {
    constructor(private readonly addTaskService:AddTaskService) {
        //No implementation
    }
    @Post()
    public async addTaskControl(@Body() task:TaskLocation):Promise<string> {
        await this.addTaskService.addTask(task.boardName,task.taskInfo.status,task.taskInfo);
        return `ADDED THE TASK ${task.taskInfo.title} TO THE GROUP ${task.taskInfo.status} OF THE BOARD ${task.boardName}`
    }
}