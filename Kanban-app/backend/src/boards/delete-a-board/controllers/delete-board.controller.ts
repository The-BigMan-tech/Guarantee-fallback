import { Controller,Delete,Param,NotFoundException} from "@nestjs/common";
import { DeleteBoardService } from "../services/delete-board.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('boards/delete')
export class DeleteBoard {
    constructor(private readonly deleteService:DeleteBoardService,private checkService:BoardCheckService) {
        //No implementation
    }
    @Delete('board/:boardName')
    public async deleteBoard(@Param('boardName') boardName:string):Promise<string> {
        let tag:string;
        let message:string;
        let boardDoesNotExist:boolean = !(await this.checkService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            tag = 'UNSAFE'
            message = `Cannot delete the board '${boardName}' because the board doesnt exist`
            throw new NotFoundException(`${tag}:${message}`)
        }  
        this.deleteService.deleteBoard(boardName)
        tag = 'SUCCESSFUL'
        message = `Deleted the board '${boardName}'`
        return `${tag}:${message}`
    }
    @Delete('/all')
    public async deleteAll():Promise<string> {
        let tag:string
        let message:string
        const result:string | void = await this.deleteService.deleteAll()
        if (result === 'nothing found') {
            tag = 'UNSAFE'
            message = 'There are no boards to be found'
            throw new NotFoundException(`${tag}:${message}`)
        }
        tag = 'SUCCESSFUL'
        message = 'Deleted all the boards'
        return `${tag}:${message}`
    }
}