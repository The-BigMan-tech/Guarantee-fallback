import { Controller,Post,Body,Delete,Query} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { TaskOperationsService } from "../services/general-ops.service";

interface TaskLocation {
    boardName:string,
    taskInfo:TaskDTO
}
interface DeleteInfo {
    boardName:string,
    groupName:string,
    title:string
}
@Controller('tasks')
export class TaskController {
    constructor(private readonly operationService:TaskOperationsService) {
        //No implementation
    }
    @Post('/addTask')
    public async addTaskControl(@Body() task:TaskLocation):Promise<string> {
        await this.operationService.addTask(task.boardName,task.taskInfo.status,task.taskInfo);
        return `ADDED THE TASK ${task.taskInfo.title} TO THE GROUP ${task.taskInfo.status} OF THE BOARD ${task.boardName}`
    }
    @Delete('/deleteTask')
    public async deleteTaskControl(@Query() task:DeleteInfo):Promise<string> {
        try {
            const result = await this.operationService.deleteTask(task.boardName,task.groupName,task.title);
            if (result === 'not found') {
                return `CANNOT DELETE THE TASK ${task.title} FROM THE GROUP ${task.groupName} FROM THE BOARD ${task.boardName} BECAUSE THE TASK DOESNT EXIST`
            }
            return `DELETED THE TASK ${task.title} FROM THE GROUP ${task.groupName} FOR THE BOARD ${task.boardName}`
        }catch {
            return `CANNOT DELETE THE TASK ${task.title} FROM THE GROUP ${task.groupName} BECAUSE THE GROUP DOESNT EXIST`
        }
    }
}