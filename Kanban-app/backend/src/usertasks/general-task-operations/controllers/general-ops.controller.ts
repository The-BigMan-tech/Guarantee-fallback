import { Controller,Post,Body,Delete,Query,Put} from "@nestjs/common";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { TaskOperationsService } from "../services/general-ops.service";


interface TaskLocation {
    boardName:string,
    taskInfo:TaskDTO
}
//*The possibility of two tasks having the same title brings up the use of its index for precision
interface DeleteInfo {
    boardName:string,
    groupName:string,
    index:number,
    title:string
}
interface EditInfo {
    boardName:string,
    groupName:string,
    index:number,
    newTask:TaskDTO
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
            const result = await this.operationService.deleteTask(task.boardName,task.groupName,task.index,task.title);
            if (result === 'not found') {
                return `CANNOT DELETE THE TASK ${task.title} FROM THE GROUP ${task.groupName} FROM THE BOARD ${task.boardName} BECAUSE THE TASK DOESNT EXIST`
            }
            return `DELETED THE TASK ${task.title} FROM THE GROUP ${task.groupName} FOR THE BOARD ${task.boardName}`
        }catch {
            return `CANNOT DELETE THE TASK ${task.title} FROM THE GROUP ${task.groupName} BECAUSE THE GROUP DOESNT EXIST`
        }
    }
    @Put('/editTask')
    public async editTaskControl(@Body() task:EditInfo):Promise<string> {
        await this.operationService.editTask(task.boardName,task.groupName,task.index,task.newTask);
        return
    }
}