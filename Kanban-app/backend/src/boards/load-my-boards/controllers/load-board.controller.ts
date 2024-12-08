import { Controller,Get} from "@nestjs/common";
import { LoadBoardService } from "../services/load-board.service";
import { BoardDocumentType } from "src/boards/schemas/board.schema";

@Controller('boards/loadmyBoards')
export class LoadBoard {
    constructor(private readonly boardService:LoadBoardService) {
        //No implementation
    }
    @Get()
    public async loadBoardsByName():Promise<BoardDocumentType[]> {
        return await this.boardService.returnBoardsByName()
    }
    @Get('forDebugging')
    public async loadBoards():Promise<string> {
        const currentBoards = JSON.stringify(await this.boardService.returnBoards(),null,5)
        return `HERE ARE THE CREATED BOARDS: \n ${currentBoards}`
    }
}