import { Controller,Delete,Query,Get} from "@nestjs/common";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { DeleteGroupService } from "../services/delete-group.service";
import { GroupInfoDTO } from "src/groups/dto/groups.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { UsePipes } from "@nestjs/common";


@Controller('groups/deleteGroup')
export class DeleteGroup {
    constructor(
        private readonly deleteGroupService:DeleteGroupService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    @Delete()
    @UsePipes(new RequestSafetyPipe())
    public async deleteGroup(@Query() group:GroupInfoDTO):Promise<string> {
        let groupExists:boolean | string = await this.groupCheckService.doesGroupExist(group.boardName,group.groupName)
        if (groupExists == 'board not found') {
            return 'BOARD NOT FOUND'
        }else if (groupExists) {
            await this.deleteGroupService.deleteGroup(group.boardName,group.groupName);
            return `DELETED THE GROUP '${group.groupName}' FROM THE BOARD '${group.boardName}'`
        }
        return `CANNOT DELETE THE GROUP '${group.groupName}' BECUASE IT DOESNT EXIST`
    }
}
