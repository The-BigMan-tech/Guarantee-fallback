import { Controller,Get,Param} from "@nestjs/common";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('boards/selectBoard/:boardName')
export class SelectBoard {
    constructor(private readonly boardDataService:BoardDataService,private readonly boardCheckService:BoardCheckService) {
        //No implementation
    }
    @Get()
    public async selectBoard(@Param('boardName') boardName:string) {
        let boardDoesNotExist = !(await this.boardCheckService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            return `CANNOT LOAD THE DATA FOR THE BOARD: ${boardName} BECAUSE IT DOESNT EXIST`
        }
        const result = await this.boardDataService.returnBoard(boardName)
        return `LOADED THE BOARD:${boardName}'s DATA:\n ${result}`
    }
}