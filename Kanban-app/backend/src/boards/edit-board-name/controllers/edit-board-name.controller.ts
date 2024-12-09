import { Controller,Put,Body} from "@nestjs/common";
import { EditBoardService } from "../services/edit-board-name.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

interface EditBoardInfo {
    oldBoardName:string,
    newBoardName:string
}
@Controller('boards/editBoard/')
export class EditBoard {
    constructor(private readonly editService:EditBoardService,private checkService:BoardCheckService) {
        //No implementation
    }
    @Put()
    public async editBoard(@Body() board:EditBoardInfo):Promise<string> {
        const boardDoesNotExist = !(await this.checkService.doesBoardExist(board.oldBoardName))
        if (boardDoesNotExist) {
            return `CANNOT CHANGE THE BOARD NAME FROM ${board.oldBoardName} TO ${board.newBoardName} BECAUSE THE BOARD DOESNT EXIST`
        }
        await this.editService.editBoard(board.oldBoardName,board.newBoardName)
        return `CHANGED THE BOARD NAME FROM ${board.oldBoardName} TO ${board.newBoardName}`
    }
}