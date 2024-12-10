import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { BoardDefinition } from "src/boards/schemas/board.schema";
import { GroupDTO } from "src/groups/dto/groups.dto";
import { TaskDTO } from "src/usertasks/dto/task.dto";

@Injectable()
export class ViewTaskService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async viewTask(boardName:string,groupName:string,index:number):Promise<TaskDTO> {
        //*The last parameter is to return the board document but should project only the group array containing only the group with the name that matches
        let board:BoardDefinition = await this.BoardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
        const group:GroupDTO = board.groups[0]
        return group.tasks[index]
    }
}