import { Controller,Post,Body} from "@nestjs/common";
import { BoardDefinition } from "../../schemas/board.schema";
import { CreateBoardService } from "../services/create-board.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";


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
    public async createBoard(@Body() board:BoardDefinition):Promise<string> {
        let result;
        const defaultGroups = ['TODO','DOING','DONE']
        board.groups = []
        for (let group of defaultGroups) {
            board.groups.push({name:group,tasks:[]})
        }
        let boardDoesNotExist = !(await this.boardCheckService.doesBoardExist(board.name))
        if (boardDoesNotExist) {
            result = await this.boardService.createBoard(board);
            return `CREATED THE BOARD:,${board.name}\n\n RESULT OF BOARD CREATION:${result}`
        }
        result = await this.boardDataService.returnBoard(board.name)
        return `CANNOT CREATE THE BOARD ${board.name} AS THE BOARD ALREADY EXISTS`
    }
}