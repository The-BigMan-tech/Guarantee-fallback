import { Controller,Post,Body} from "@nestjs/common";
import { BoardDefinition } from "../../schemas/board.schema";
import { CreateBoardService } from "../services/create-board.service";

@Controller('boards/createBoard')
export class CreateBoard {
    constructor(private readonly boardService:CreateBoardService) {
        //No implementation
    }
    @Post()
    public async createBoard(@Body() board:BoardDefinition):Promise<string> {
        let result;
        let boardDoesNotExist = !(await this.boardService.doesBoardExist(board.name))
        if (boardDoesNotExist) {
            result = await this.boardService.createBoard(board);
            return `CREATED THE BOARD:,${board.name}\n\n RESULT OF BOARD CREATION:${result}`
        }
        result = await this.boardService.returnBoard(board)
        return `CANNOT CREATE THE BOARD ${board.name} AS THE BOARD ALREADY EXISTS`
    }
}