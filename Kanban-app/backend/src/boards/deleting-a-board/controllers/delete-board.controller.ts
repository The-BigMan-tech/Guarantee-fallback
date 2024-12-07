import { Controller,Delete,Param} from "@nestjs/common";
import { DeleteBoardService } from "../services/delete-board.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('boards/deleteBoard/:boardName')
export class DeleteBoard {
    constructor(private readonly deleteService:DeleteBoardService,private checkService:BoardCheckService) {
        //No implementation
    }
    @Delete()
    public async deleteBoard(@Param('boardName') boardName:string):Promise<string> {
        let boardDoesNotExist = !(await this.checkService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            return `CANNOT DELETE THE BOARD,${boardName} AS THE BOARD DOES NOT EXIST`
        }
        this.deleteService.deleteBoard(boardName)
        return `DELETED THE BOARD: ${boardName}`
    }
}