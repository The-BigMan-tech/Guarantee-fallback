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
    public async deleteTask(boardName:string,groupName:string,title:string):Promise<string | void> {
        //*The last parameter is to project only the group array containing only the group with the name that matches
        const board = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        console.log(board);
        const group = board.groups[0]

        //*Find the index where the task we want to delete belongs,remove it through the splice method and update the board by setting the tasks array of the particular group with this new one
        const taskIndex = group.tasks.findIndex(task=> {task.title===title})
        console.log("INDEX",taskIndex);
        if (taskIndex === -1) {
            return 'not found'
        }
        group.tasks.splice(taskIndex,1)
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } // Use $pull to remove the task by title
        ).exec();
    }
}