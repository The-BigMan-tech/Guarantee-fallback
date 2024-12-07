import { Controller,Post,Body} from "@nestjs/common";
import { BoardDefinition } from "../schemas/board.schema";
import { CreateBoardService } from "../services/create-board.service";

@Controller('boards/createBoard')
export class CreateBoard {
    constructor(private readonly boardService:CreateBoardService) {
        //No implementation
    }
    @Post()
    public createBoard(@Body() board:BoardDefinition) {
        return `Created the board ${board}`
    }
}