import { Controller,Get,Param,NotFoundException} from "@nestjs/common";
import { BoardDataService } from "src/boards/common-services/services/get-board-data.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { BoardDefinition, BoardDocumentType } from "src/boards/schemas/board.schema";

@Controller('boards')
export class SelectBoard {
    constructor(private readonly boardDataService:BoardDataService,private readonly boardCheckService:BoardCheckService) {
        //No implementation
    }
    public async selectBoard(boardName:string,option:string) {
        let tag:string;
        let message:string;
        let result;
        let boardDoesNotExist:boolean = !(await this.boardCheckService.doesBoardExist(boardName))
        if (boardDoesNotExist) {
            tag = 'UNSAFE'
            message = `Cannot load the data for the board '${boardName}' because it doesnt exist`
            throw new NotFoundException(`${tag}:${message}`);
        }
        if (option === 'object') {
            result = await this.boardDataService.returnBoard(boardName)
            return result
        }else if (option === 'string'){
            result = await this.boardDataService.returnBoardAsString(boardName)
            tag = 'SUCCESSFUL'
            message = `Loaded '${boardName}' data:\n ${result}`
            return `${tag}:${message}`
        }
    }
    
    @Get('/selectBoard/:boardName')
    public async selectBoardObject(@Param('boardName') boardName:string) {
        return this.selectBoard(boardName,'object')
    }
    @Get('/selectBoard/:boardName/readable')
    public async selectReadableBoard(@Param('boardName') boardName:string) {
        return this.selectBoard(boardName,'string')
    }
    @Get('/loadSelectedboard')
    public async loadSelectedBoard():Promise<BoardDocumentType> {
        let boards:BoardDocumentType[] = await this.boardDataService.returnBoards()
        for (let board of boards) {
            if (board.isSelected) {
                return board
            }
        }
        return {} as BoardDocumentType
    }
    @Get('/pushBoard/:boardName')
    public async selectedBoard(@Param('boardName') boardName:string):Promise<BoardDocumentType> {
        await this.boardDataService.selectBoard(boardName)
        return 
    }
}