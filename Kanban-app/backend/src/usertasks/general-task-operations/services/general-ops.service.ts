import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { GroupDTO } from "src/groups/dto/groups.dto";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class TaskOperationsService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async doesTaskExist(group:GroupDTO,index:number,title:string):Promise<boolean> {
        const task = group.tasks[index]
        if ((task) && (task.title === title)) {
            return true
        }
        return false
    }
    public async deleteTask(boardName:string,groupName:string,index:number,title:string):Promise<string | void> {
        //*The last parameter is to return the board document but should project only the group array containing only the group with the name that matches
        let board:BoardDefinition = await this.BoardModel.findOne({name:boardName})
        if (!board) {
            return 'board not found'
        }
        board = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        if (!board) {
            return 'group not found'
        }
        const group:GroupDTO = board.groups[0]
        const taskDoesNotExist = !(await this.doesTaskExist(group,index,title))
        if (taskDoesNotExist) {
            return 'task not found'
        }
        group.tasks.splice(index,1)
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } // Use $pull to remove the task by title
        ).exec();
    }
    /**
     * *The $ returns the first element in array that matches the query
     * *The dot operator means look for one group in that array that matches the criteria specified
     * *The dot operator is to query into nested structures.for objects,you provide the key and for an array,the index.
     * *The first query in the update one method will be the context of the second query
     */
    public async editTask(boardName:string,groupName:string,index:number,newTask:TaskDTO):Promise<string | void> {
        let board:BoardDefinition = await this.BoardModel.findOne({name:boardName})
        if (!board) {
            return 'board not found'
        }
        board = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        if (!board) {
            return 'group not found'
        }

        const group:GroupDTO = board.groups[0]
        const task:TaskDTO = group.tasks[index]
        if (!task) {
            return 'task not found'
        }
        const updatedTask:TaskDTO = {...task,...newTask}
        await this.BoardModel.updateOne(
            {name:boardName,"groups.name":groupName,"groups.tasks.title":task.title},
            //*we use square brackets because it allows you to evaluate an expression as an object key
            {$set:{[`groups.$.tasks.${index}`]:updatedTask}}
        ).exec()
        return task.title
    }
}