import { Controller,Post,Body, UsePipes,NotFoundException} from "@nestjs/common";
import { CreateBoardService } from "../services/create-board.service.js";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";
import { BoardDTO } from "src/boards/dtos/board.dto";
import { RequestSafetyPipe } from "src/pipes/request-safety.pipe";
import { BoardDocumentType } from "src/boards/schemas/board.schema.js";


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
        let tag:string
        let message:string
        let result:BoardDocumentType
        const defaultGroups:string[] = ['TODO','DOING','DONE'];
        board.groups = [];
        board.isSelected = false
        for (let group of defaultGroups) {
            board.groups.push({name:group,tasks:[]})
        }
        let boardDoesNotExist:boolean = !(await this.boardCheckService.doesBoardExist(board.name))
        if (boardDoesNotExist) {
            result = await this.boardService.createBoard(board);
            console.log(board.isSelected)
            tag = 'SUCCESSFUL'
            message = `Created a board named '${board.name}'\nInitial data for the board:\n${result}`
            return `${tag}:${message}`
        }
        result = await this.boardDataService.returnBoard(board.name)
        tag = 'UNSAFE'
        message = `Cannot create the board '${board.name}' because the board already exists`
        throw new NotFoundException(`${tag}:${message}`) 
    }
}