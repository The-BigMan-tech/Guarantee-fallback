import { Controller,Delete,Query,Get,NotFoundException} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { DeleteGroupService } from "../services/delete-group.service";
import { GroupInfoDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('groups/deleteGroup')
export class DeleteGroup {
    constructor(
        private readonly deleteGroupService:DeleteGroupService,
        private readonly groupCheckService:GroupCheckService,
        private readonly boardCheckService:BoardCheckService
    ) {
        //No implementation
    }
    @Delete()
    @UsePipes(new RequestSafetyPipe())
    public async deleteGroup(@Query() group:GroupInfoDTO):Promise<string> {
        let tag:string;
        let message:string;
        let boardExists:boolean = await this.boardCheckService.doesBoardExist(group.boardName)
        if (!boardExists) {
            tag = 'UNSAFE'
            message = `Cannot delete the group '${group.groupName}' from the board '${group.boardName}' because the board doesnt exist`
            throw new NotFoundException(`${tag}:${message}`)
        }
        let groupExists:boolean = await this.groupCheckService.doesGroupExist(group.boardName,group.groupName)
        if (groupExists) {
            await this.deleteGroupService.deleteGroup(group.boardName,group.groupName);
            tag = 'SUCCESSFUL'
            message = `Deleted the group '${group.groupName}' from the board '${group.boardName}'`
            return `${tag}:${message}`
        }
        tag = 'UNSAFE'
        message = `Cannot delete the group '${group.groupName}' from the board '${group.boardName}' because the group doesnt exist`
        throw new NotFoundException(`${tag}:${message}`)
    }
}
