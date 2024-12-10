import { Controller,Put,Body, UsePipes,NotFoundException} from "@nestjs/common";
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
        let tag:string;
        let message:string;
        const boardDoesNotExist = !(await this.checkService.doesBoardExist(board.oldBoardName))
        if (boardDoesNotExist) {
            tag = 'UNSAFE'
            message = `Cannot change the board name from '${board.oldBoardName}' to '${board.newBoardName}' because the board doesnt exist'`
            throw new NotFoundException(`${tag}:${message}`)
        }
        await this.editService.editBoard(board.oldBoardName,board.newBoardName)
        tag = 'SUCCESSFUL'
        message = `Changed the board name from '${board.oldBoardName}' to '${board.newBoardName}'`
        return `${tag}:${message}`
    }
}