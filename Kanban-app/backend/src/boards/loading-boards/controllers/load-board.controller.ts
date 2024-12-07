import { Controller,Get} from "@nestjs/common";
import { LoadBoardService } from "../services/load-board.service";

@Controller('boards/loadBoards')
export class LoadBoard {
    constructor(private readonly boardService:LoadBoardService) {
        //No implementation
    }
    @Get()
    public async loadBoards():Promise<string> {
        const currentBoards = JSON.stringify(await this.boardService.returnBoards(),null,5)
        return `HERE ARE THE CREATED BOARDS: \n ${currentBoards}`
    }
}