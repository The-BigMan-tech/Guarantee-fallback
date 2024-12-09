import { Controller,Post,Body, UsePipes} from "@nestjs/common";
import { CreateBoardService } from "../services/create-board.service.js";
import chalk from 'chalk'
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";
import { BoardDTO } from "src/boards/dtos/board.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";

@Controller('boards/createBoard')
export class CreateBoard {
    constructor(
        private readonly boardService:CreateBoardService,
        private readonly boardCheckService:BoardCheckService,
        private readonly boardDataService:BoardDataService
    ) {
        //No implementation
    }
    @Post()
    @UsePipes(new RequestSafetyPipe())
    public async createBoard(@Body() board:BoardDTO):Promise<string> {
        let result;
        const defaultGroups = ['TODO','DOING','DONE'];
        board.groups = [];
        for (let group of defaultGroups) {
            board.groups.push({name:group,tasks:[]})
        }
        let boardDoesNotExist = !(await this.boardCheckService.doesBoardExist(board.name))
        if (boardDoesNotExist) {
            result = await this.boardService.createBoard(board);
            return `${chalk.green('SUCCESSS: ')}'Created a board named ${board.name}'\n\n Here is the board data:\n${result}`
        }
        result = await this.boardDataService.returnBoard(board.name)
        return `CANNOT CREATE THE BOARD '${board.name}' AS THE BOARD ALREADY EXISTS`
    }
}