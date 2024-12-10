import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class AddTaskService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async addTask(boardName:string,groupName:string,taskInfo:TaskDTO):Promise<void> {
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $push: { "groups.$.tasks": taskInfo } }     // Push the new task
        ).exec();
    }
}