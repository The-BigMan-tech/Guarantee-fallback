import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class EditGroupService {
    constructor(@InjectModel('Board') private boardModel:BoardModelType) {
        //No implementation
    }
    public async editGroup(boardName:string,oldGroupName:string,newGroupName:string):Promise<void> {
        const board:BoardDefinition = await this.boardModel.findOne({name:boardName}).exec();
        for (let group of board.groups) {
            if (group.name == oldGroupName) {
                for (let task of group.tasks) {
                    task.status = newGroupName
                }
                group.name = newGroupName;
                await this.boardModel.updateOne({name:boardName},{groups:board.groups})
                break
            }
        }
    }
}