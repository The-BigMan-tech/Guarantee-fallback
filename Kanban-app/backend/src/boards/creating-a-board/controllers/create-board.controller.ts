import { Controller,Post,Body} from "@nestjs/common";
import { BoardDefinition } from "../schemas/board.schema";
import { CreateBoardService } from "../services/create-board.service";

@Controller('boards/createBoard')
export class CreateBoard {
    constructor(private readonly boardService:CreateBoardService) {
        //No implementation
    }
    @Post()
    public async createBoard(@Body() board:BoardDefinition) {
        let result;
        if (!this.boardService.doesBoardExist(board)) {
            result = await this.boardService.createBoard(board);
            const currentBoards = JSON.stringify(await this.boardService.returnBoards(),null,5)
            return `CREATED THE BOARD:,${board.name}\n\n RESULT OF BOARD CREATION:${result}\n\n CURRENT BOARDS:${currentBoards}`
        }
        result = await this.boardService.returnBoard(board)
        return `CANNOT CREATE THE BOARD ${board.name} AS THE BOARD ALREADY EXISTS`
    }
}