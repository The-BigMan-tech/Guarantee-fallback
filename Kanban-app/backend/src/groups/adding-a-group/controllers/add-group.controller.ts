import { Controller,Post,Body} from "@nestjs/common";
import { AddGroupService } from "../services/add-group.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

interface GroupInfo {
    boardName:string,
    groupName:string
}
@Controller('boards/addGroup/')
export class AddGroup {
    constructor(private readonly addGroupService:AddGroupService,private readonly groupCheckService:GroupCheckService) {
        //No implementation
    }
    @Post()
    public async addGroup(@Body() group:GroupInfo):Promise<string> {
        let groupDoesNotExist:boolean = !(await this.groupCheckService.doesGroupExist(group.boardName,group.groupName))
        if (groupDoesNotExist) {
            await this.addGroupService.addGroup(group.boardName,group.groupName);
            return `ADDED THE GROUP ${group.groupName} TO THE BOARD ${group.boardName}`
        }
        return `CANNOT ADD THE GROUP: ${group.groupName} TO THE BOARD ${group.boardName} BECAUSE THE GROUP ALREADY EXISTST`
    }
}