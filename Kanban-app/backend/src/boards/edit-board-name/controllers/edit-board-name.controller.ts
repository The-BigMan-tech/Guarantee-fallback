import { Controller,Put,Body, UsePipes} from "@nestjs/common";
import { EditBoardService } from "../services/edit-board-name.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { EditBoardDTO } from "src/boards/dtos/board.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";

@Controller('boards/editBoard/')
export class EditBoard {
    constructor(private readonly editService:EditBoardService,private checkService:BoardCheckService) {
        //No implementation
    }
    @Put()
    @UsePipes(new RequestSafetyPipe())
    public async editBoard(@Body() board:EditBoardDTO):Promise<string> {
        const boardDoesNotExist = !(await this.checkService.doesBoardExist(board.oldBoardName))
        if (boardDoesNotExist) {
            return `CANNOT CHANGE THE BOARD NAME FROM '${board.oldBoardName}' TO '${board.newBoardName}' BECAUSE THE BOARD DOESNT EXIST`
        }
        await this.editService.editBoard(board.oldBoardName,board.newBoardName)
        return `CHANGED THE BOARD NAME FROM ${board.oldBoardName} TO ${board.newBoardName}`
    }
}