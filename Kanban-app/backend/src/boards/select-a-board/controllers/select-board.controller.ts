import { Controller,Get,Param} from "@nestjs/common";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

@Controller('boards/selectBoard/:boardName')
export class SelectBoard {
    constructor(private readonly boardDataService:BoardDataService,private readonly boardCheckService:BoardCheckService) {
        //No implementation
    }
    public async selectBoard(boardName:string,option:string) {
        let result;
        let boardDoesNotExist = !(await this.boardCheckService.doesBoardExist(boardName))
        if (boardDoesNotExist) return `CANNOT LOAD THE DATA FOR THE BOARD: ${boardName} BECAUSE IT DOESNT EXIST`;
        if (option === 'object') {
            result = await this.boardDataService.returnBoard(boardName)
        }else if (option === 'string'){
            result = await this.boardDataService.returnBoardAsString(boardName)
        }
        return `LOADED THE BOARD:${boardName}'s DATA:\n ${result}`
    }
    
    @Get()
    public async selectBoardObject(@Param('boardName') boardName:string) {
        return this.selectBoard(boardName,'object')
    }
    @Get('readable')
    public async selectReadableBoard(@Param('boardName') boardName:string) {
        return this.selectBoard(boardName,'string')
    }
}