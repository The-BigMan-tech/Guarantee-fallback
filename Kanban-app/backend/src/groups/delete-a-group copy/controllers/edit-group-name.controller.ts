import { Controller,Put,Body} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { EditGroupService } from "../services/edit-group-name.service";

interface EditGroupInfo {
    boardName:string,
    oldGroupName:string,
    newGroupName:string
}

@Controller('groups/editGroup')
export class EditGroup {
    constructor(
        private readonly editGroupService:EditGroupService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    @Put()
    public async editGroup(@Body() group:EditGroupInfo):Promise<string> {
        const groupDoesNotExist:boolean = !(await this.groupCheckService.doesGroupExist(group.boardName,group.oldGroupName))
        if (groupDoesNotExist) {
            return `CANNOT CHANGE THE GROUP NAME OF THE BOARD ${group.boardName} FROM ${group.oldGroupName} TO ${group.newGroupName} BECAUSE THE GROUP DOESNT EXIST`;
        }
        return `CHANGED THE GROUP NAME OF THE BOARD ${group.boardName} FROM ${group.oldGroupName} TO ${group.newGroupName}`
    }
}
