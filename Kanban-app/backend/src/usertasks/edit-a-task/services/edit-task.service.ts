import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { TaskDTO } from "src/usertasks/dto/task.dto";
import { GroupDTO } from "src/groups/dto/groups.dto";
import { BoardDocumentType } from "src/boards/schemas/board.schema";

@Injectable()
export class EditTaskService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    /**
     * *The $ returns the first element in array that matches the query
     * *The dot operator means look for one group in that array that matches the criteria specified
     * *The dot operator is to query into nested structures.for objects,you provide the key and for an array,the index.
     * *The first query in the update one method will be the context of the second query
     */
    public async editTask(boardName:string,groupName:string,index:number,newTask:TaskDTO):Promise<string | void> {
        const board:BoardDocumentType = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        const group:GroupDTO = board.groups[0];
        const task:TaskDTO = group.tasks[index]
        const updatedTask:TaskDTO = {...task,...newTask}
        if (task.status == newTask.status) {
            group.tasks[index] = updatedTask
            await this.BoardModel.updateOne(
                { name: boardName, "groups.name": groupName }, // Find the board and group
                { $set: { "groups.$.tasks":group.tasks } } 
            ).exec();
            return
        }
        group.tasks.splice(index,1)
        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } 
        ).exec();
        await this.BoardModel.updateOne(
            {'groups.name':updatedTask.status},
            {$push:{'groups.$.tasks':updatedTask}}
        );
        return task.title;
    }
    public async editTaskIndex(boardName:string,groupName:string,index:number,newIndex:number,direction:string):Promise<void> {
        const board:BoardDocumentType = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        const group:GroupDTO = board.groups[0];
        const task:TaskDTO = group.tasks[index]

        console.log('ORIGINAL INDEX: ',index);
        console.log('DIRECTION OF CHANGE',direction);
        if ((direction == 'up') || (direction =='dynamic')) {
            index = index + 1;
        }
        console.log('INDEX TO THROW AWAY AFTER CHANGING DIRECTION',index);
        
        console.log('STEP 1',group.tasks);
        if ((newIndex !== 0) && (direction != 'dynamic')) {
            newIndex = newIndex + 1
        }
        group.tasks.splice(newIndex,0,task)
        console.log('TASKS AFTER INSERTING AT THE NEW INDEX',group.tasks,'new index',newIndex)

        group.tasks.splice(index,1)
        console.log('TASK AFTER REMOVING THAT INDEX: ',group.tasks,'THREW AWAY: ',index)

        await this.BoardModel.updateOne(
            { name: boardName, "groups.name": groupName }, // Find the board and group
            { $set: { "groups.$.tasks":group.tasks } } 
        ).exec();
    }
}