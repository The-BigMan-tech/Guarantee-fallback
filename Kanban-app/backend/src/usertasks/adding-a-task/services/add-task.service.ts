import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { TaskDTO } from "src/usertasks/dto/task.dto";

@Injectable()
export class AddTaskService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async addTask(boardName:string,groupName:string,taskInfo:TaskDTO):Promise<void> {
        await this.BoardModel.updateOne(
            {name: boardName, "groups.name": groupName }, 
            { $push: { "groups.$.tasks": taskInfo} } 
        );
        const result = await this.BoardModel.findOne({name: boardName})
        console.log(`Current tasks for the group:${groupName}\n,${result.groups[0]}`);
    }
}