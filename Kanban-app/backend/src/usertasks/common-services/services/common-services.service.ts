import { Injectable,NotFoundException} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";
import { GroupDTO } from "src/groups/dto/groups.dto";
import { TaskDTO } from "src/usertasks/dto/task.dto";


@Injectable()
export class allCheckService {
    constructor(
        @InjectModel('Board') private boardModel:BoardModelType,
        private readonly boardCheckService:BoardCheckService,
        private readonly groupCheckService:GroupCheckService
    ) {
        //No implementation
    }
    public async checkForAll(boardName:string,groupName:string,checkForTask?:boolean,taskIndex?:number):Promise<string | void> {
        const boardExists = await this.boardCheckService.doesBoardExist(boardName)
        if (!boardExists) {
            return `board not found`
        }
        const groupExists = await this.groupCheckService.doesGroupExist(boardName,groupName)
        if (!groupExists) {
            return `group not found`
        }
        if (checkForTask) {
            let board = await this.boardModel.findOne({name:boardName,"groups.name": groupName},{'groups.$':1}).exec()
            const group:GroupDTO = board.groups[0]
            const task:TaskDTO = group.tasks[taskIndex]
            if (!task) {
                return 'task not found'
            }
            return task.title
        }
    }   
    public async checkOperationSafety(operationType:string,boardName:string,groupName:string,checkForTask:boolean=false,taskIndex?:number):Promise<string | string[]> {
        let tag:string;
        let message:string;
        const warning:string | void = await this.checkForAll(boardName,groupName,checkForTask,taskIndex)
        if (warning === 'board not found' || 'group not found' || 'task not found') {
            tag = 'UNSAFE'
        }
        if (warning === 'board not found') {
            message = `The board,'${boardName}' doesnt exist to perform the ${operationType} operation`
            throw new NotFoundException(`${tag}:${message}`)
        }else if (warning === 'group not found') {
            message = `The group,'${groupName}' doesnt exist to perform the ${operationType} operation`
            throw new NotFoundException(`${tag}:${message}`)
        }else if (warning === 'task not found') {
            message = `No task exist at the query you provided to perform the ${operationType} operation`
            throw new NotFoundException(`${tag}:${message}`)
        }else {
            return ['operation is safe',warning as string]
        }
    }
}