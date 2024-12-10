import { Controller,Put,Body,NotFoundException} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { EditGroupService } from "../services/edit-group-name.service";
import { EditGroupDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('groups/editGroup')
export class EditGroup {
    constructor(
        private readonly editGroupService:EditGroupService,
        private readonly groupCheckService:GroupCheckService,
        private readonly boardCheckService:BoardCheckService
    ) {
        //No implementation
    }
    @Put()
    @UsePipes(new RequestSafetyPipe())
    public async editGroup(@Body() group:EditGroupDTO):Promise<string> {
        let tag:string;
        let message:string;
        const boardExists:boolean = await this.boardCheckService.doesBoardExist(group.boardName)
        if (!boardExists) {
            tag = 'UNSAFE'
            message = `The board you provided,'${group.boardName}' doesnt exist to perform the edit operation`
            throw new NotFoundException(`${tag}:${message}`)
        }
        const groupExists:boolean = await this.groupCheckService.doesGroupExist(group.boardName,group.oldGroupName)
        if (!groupExists) {
            tag = 'UNSAFE'
            message = `The group you provided,'${group.oldGroupName}' doesnt exist to perform the edit operation`
            throw new NotFoundException(`${tag}:${message}`)
        }
        await this.editGroupService.editGroup(group.boardName,group.oldGroupName,group.newGroupName);
        tag = 'SUCCESSFUL'
        message = `Changed a group name of the board '${group.boardName}' from '${group.oldGroupName} to ${group.newGroupName}'`
        return `${tag}:${message}`
    }
}
