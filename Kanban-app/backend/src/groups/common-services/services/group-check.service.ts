import { Injectable } from "@nestjs/common";
import { BoardModelType} from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class GroupCheckService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async doesGroupExist(boardName:string,groupName:string):Promise<boolean> {
        const existingBoard:BoardDefinition = await this.BoardModel.findOne({name:boardName}).exec();
        for (let group of existingBoard.groups) {
            if (group.name == groupName) {
                return true
            }
        }
        return false
    }
}