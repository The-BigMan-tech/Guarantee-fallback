import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class DeleteGroupService {
    constructor(@InjectModel('Board') private boardModel:BoardModelType) {
        //No implementation
    }
    public async deleteGroup(boardName:string,groupName:string):Promise<void> {
        const oldBoard:BoardDefinition = await this.boardModel.findOne({name:boardName}).exec();
        let updatedBoard = {name:oldBoard.name,groups:[]};
        for (let group of oldBoard.groups) {
            if (group.name == groupName) {
                //*the real deleting takes place at the filter
                updatedBoard.groups = oldBoard.groups.filter((group) => group.name != groupName);
                await this.boardModel.findOneAndReplace(oldBoard,updatedBoard)
            }
        }
    }
}