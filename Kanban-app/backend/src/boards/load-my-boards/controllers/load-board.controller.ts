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
        let currentBoards:BoardDocumentType[] = await this.boardService.returnBoards()
        let tag:string = 'SUCCESSFUL';
        let message:string;
        if (currentBoards.length) {
            let stringedCurrentBoards:string = JSON.stringify(currentBoards,null,3)
            message = `Here are your boards: \n ${stringedCurrentBoards}`
            return `${tag}:${message}`
        }
        message = 'But you have no boards'
        return `${tag}:${message}`
    }
}