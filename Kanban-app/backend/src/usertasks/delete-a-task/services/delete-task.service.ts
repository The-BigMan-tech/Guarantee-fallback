import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { BoardDefinition } from "src/boards/schemas/board.schema";
import { GroupDTO } from "src/groups/dto/groups.dto";


@Injectable()
export class DeleteTaskService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async deleteTask(boardName:string,groupName:string,index:number):Promise<void> {
        //*The last parameter is to return the board document but should project only the group array containing only the group with the name that matches
        let board:BoardDefinition = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        const group:GroupDTO = board.groups[0]
        group.tasks.splice(index,1)
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } // Use $pull to remove the task by title
        ).exec();
    }
}