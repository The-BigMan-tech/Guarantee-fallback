import { Controller,Post,Body} from "@nestjs/common";
import { AddGroupService } from "../services/add-group.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { GroupInfoDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";

@Controller('groups/addGroup/')
export class AddGroup {
    constructor(private readonly addGroupService:AddGroupService,private readonly groupCheckService:GroupCheckService) {
        //No implementation
    }
    @Post()
    @UsePipes(new RequestSafetyPipe())
    public async addGroup(@Body() group:GroupInfoDTO):Promise<string> {
        let groupDoesNotExist:boolean = !(await this.groupCheckService.doesGroupExist(group.boardName,group.groupName))
        if (groupDoesNotExist) {
            await this.addGroupService.addGroup(group.boardName,group.groupName);
            return `ADDED THE GROUP '${group.groupName}' TO THE BOARD '${group.boardName}'`
        }
        return `CANNOT ADD THE GROUP: '${group.groupName}' TO THE BOARD '${group.boardName}' BECAUSE THE GROUP ALREADY EXIST`
    }
}