import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class EditGroupService {
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
    public async editGroup(boardName:string,oldGroupName:string,newGroupName:string):Promise<void> {
        const board:BoardDefinition = await this.boardModel.findOne({name:boardName}).exec();
        for (let group of board.groups) {
            if (group.name == oldGroupName) {
                group.name = newGroupName;
                await this.boardModel.findOneAndReplace(board,board);
            }
        }
    }
}