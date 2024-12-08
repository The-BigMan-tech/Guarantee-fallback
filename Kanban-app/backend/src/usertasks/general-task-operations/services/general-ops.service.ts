import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { TaskDTO } from "src/usertasks/dto/task.dto";

@Injectable()
export class TaskOperationsService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async addTask(boardName:string,groupName:string,taskInfo:TaskDTO):Promise<void> {
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $push: { "groups.$.tasks": taskInfo } }     // Push the new task
        ).exec();
    }
    public async deleteTask(boardName:string,groupName:string,title:string):Promise<void> {
        const board = await this.BoardModel.findOne({name:boardName,"groups.name": groupName})
        const group = board.groups[0]
        const taskIndex = group.tasks.findIndex(task=>task.title===title)
        group.tasks.splice(taskIndex,1)
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } // Use $pull to remove the task by title
        ).exec();
    }
}