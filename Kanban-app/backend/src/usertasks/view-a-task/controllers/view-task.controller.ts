import { Controller,UsePipes,Get,Query} from "@nestjs/common";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { allCheckService } from "src/usertasks/common-services/services/common-services.service";
import { ViewTaskService } from "../services/view-task.service";
import { GeneralDetailsDTO } from "src/usertasks/dto/task.dto";
import { TaskDTO } from "src/usertasks/dto/task.dto";

@Controller('tasks/viewTask')
export class ViewTaskControl {
    constructor(
        private readonly allCheckService:allCheckService,
        private readonly viewTaskService:ViewTaskService
    ) {

    }
    @Get()
    @UsePipes(new RequestSafetyPipe())
    public async viewTaskControl(@Query() task:GeneralDetailsDTO):Promise<string | TaskDTO> {
        let tag:string;
        let message:string;
        const warningMessage:string | string[] = await this.allCheckService.checkOperationSafety('get',task.boardName,task.groupName,true,task.index)
        if (!Array.isArray(warningMessage)) {
            return warningMessage 
        }
        const taskData:TaskDTO = await this.viewTaskService.viewTask(task.boardName,task.groupName,task.index);
        tag = 'SUCCESSFUL';
        message = 'Here is the task\'s data:\n';
        return taskData;
    }
}