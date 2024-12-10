import { Controller,Put,Body} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { EditGroupService } from "../services/edit-group-name.service";
import { EditGroupDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";

@Controller('groups/editGroup')
export class EditGroup {
    constructor(
        private readonly editGroupService:EditGroupService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    @Put()
    @UsePipes(new RequestSafetyPipe())
    public async editGroup(@Body() group:EditGroupDTO):Promise<string> {
        const groupExists:boolean | string = await this.groupCheckService.doesGroupExist(group.boardName,group.oldGroupName)
        if (!groupExists) {
            return `CANNOT CHANGE THE GROUP NAME OF THE BOARD '${group.boardName}' FROM '${group.oldGroupName}' TO '${group.newGroupName}' BECAUSE THE GROUP OR THE BOARD DOESNT EXIST`;
        }
        await this.editGroupService.editGroup(group.boardName,group.oldGroupName,group.newGroupName);
        return `CHANGED THE GROUP NAME OF THE BOARD '${group.boardName}' FROM '${group.oldGroupName}' TO '${group.newGroupName}'`
    }
}
