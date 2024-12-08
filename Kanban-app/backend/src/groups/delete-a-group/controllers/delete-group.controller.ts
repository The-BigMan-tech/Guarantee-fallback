import { Controller,Delete,Query,Get} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { DeleteGroupService } from "../services/delete-group.service";

interface GroupInfo {
    boardName:string,
    groupName:string
}

@Controller('groups/deleteGroup')
export class DeleteGroup {
    constructor(
        private readonly deleteGroupService:DeleteGroupService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    @Delete()
    public async deleteGroup(@Query() group:GroupInfo):Promise<string> {
        let groupExists:boolean = await this.groupCheckService.doesGroupExist(group.boardName,group.groupName)
        if (groupExists) {
            await this.deleteGroupService.deleteGroup(group.boardName,group.groupName);
            return `DELETED THE GROUP ${group.groupName} FROM THE BOARD ${group.boardName}`
        }
        return `CANNOT DELETE THE GROUP ${group.groupName} BECUASE IT DOESNT EXIST`
    }
}
