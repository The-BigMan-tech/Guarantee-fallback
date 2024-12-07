import { Controller,Delete,Param} from "@nestjs/common";
import { DeleteBoardService } from "../services/delete-board.service";
import { CreateBoardService } from "src/boards/creating-a-board/services/create-board.service";

@Controller('boards/deleteBoard/:board')
export class DeleteBoard {
    constructor(private readonly deleteService:DeleteBoardService,private createService:CreateBoardService) {
        //No implementation
    }
    @Delete()
    public async deleteBoard(@Param('board') boardName:string):Promise<string> {
        let boardDoesNotExist = !(await this.createService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            return `CANNOT DELETE THE BOARD,${boardName} AS THE BOARD DOES NOT EXIST`
        }
        this.deleteService.deleteBoard(boardName)
        return `DELETED THE BOARD: ${boardName}`
    }
}