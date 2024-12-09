import { Injectable } from "@nestjs/common";
import { BoardModelType} from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class GroupCheckService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async doesGroupExist(boardName:string,groupName:string):Promise<boolean | string> {
        const existingBoard:BoardDefinition = await this.BoardModel.findOne({name:boardName}).exec();
        if (!existingBoard) {
            return 'board not found'
        }
        for (let group of existingBoard.groups) {
            if (group.name == groupName) {
                return true
            }
        }
        return false
    }
}