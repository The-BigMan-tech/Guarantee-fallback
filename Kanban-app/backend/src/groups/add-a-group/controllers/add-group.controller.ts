import { Controller,Post,Body,NotFoundException} from "@nestjs/common";
import { AddGroupService } from "../services/add-group.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { GroupInfoDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";


@Controller('groups/addGroup/')
export class AddGroup {
    constructor(
        private readonly addGroupService:AddGroupService,
        private readonly groupCheckService:GroupCheckService,
        private readonly boardCheckService:BoardCheckService
    ) {
        //No implementation
    }
    @Post()
    @UsePipes(new RequestSafetyPipe())
    public async addGroup(@Body() group:GroupInfoDTO):Promise<string> {
        let tag:string;
        let message:string;

        let boardExists:boolean = await this.boardCheckService.doesBoardExist(group.boardName);
        if (!boardExists) {
            tag = 'UNSAFE'
            message = `Cannot add the group '${group.groupName}' to the board '${group.boardName}' because the board doesnt exist`
            throw new NotFoundException(`${tag}:${message}`)
        }
        let groupExists:boolean = await this.groupCheckService.doesGroupExist(group.boardName,group.groupName)
        if (!groupExists) {
            await this.addGroupService.addGroup(group.boardName,group.groupName);
            tag = 'SUCCESSFUL'
            message = `Added the group '${group.groupName}' to the board '${group.boardName}'`
            return `${tag}:${message}`
        }
        tag = 'UNSAFE'
        message = `Cannot add the group '${group.groupName}' to the board '${group.boardName}' because the group already exists`
        throw new NotFoundException(`${tag}:${message}`)
    }
}