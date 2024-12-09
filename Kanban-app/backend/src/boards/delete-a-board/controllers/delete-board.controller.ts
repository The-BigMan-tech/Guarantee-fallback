import { Controller,Delete,Param} from "@nestjs/common";
import { DeleteBoardService } from "../services/delete-board.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('boards/delete')
export class DeleteBoard {
    constructor(private readonly deleteService:DeleteBoardService,private checkService:BoardCheckService) {
        //No implementation
    }
    @Delete('board/:boardName')
    public async deleteBoard(@Param('boardName') boardName:string):Promise<string> {
        let boardDoesNotExist = !(await this.checkService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            return `CANNOT DELETE THE BOARD,'${boardName}' AS THE BOARD DOES NOT EXIST`
        }
        this.deleteService.deleteBoard(boardName)
        return `DELETED THE BOARD: '${boardName}'`
    }
    @Delete('/all')
    public async deleteAll():Promise<string> {
        await this.deleteService.deleteAll()
        return 'Deleted all the boards'
    }
}