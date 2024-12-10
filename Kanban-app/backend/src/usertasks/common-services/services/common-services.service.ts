import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

@Injectable()
export class allCheckService {
    constructor(
        @InjectModel('Board') boardModel:BoardModelType,
        private readonly boardCheckService:BoardCheckService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    public async checkForAll(boardName:string,groupName:string,taskName:string):Promise<string | void> {
        const boardExists = await this.boardCheckService.doesBoardExist(boardName)
        if (!boardExists) {
            return `The board,'${boardName}' doesnt exist to add the task,'${taskName}' to the group '${groupName}'`
        }
        const groupExists = await this.groupCheckService.doesGroupExist(boardName,groupName)
        if (!groupExists) {
            return `The group, '${groupName}' doesnt exist on the board,'${boardName}' to add the task '${taskName}'`
        }
    }   
}