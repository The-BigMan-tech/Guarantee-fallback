import { Injectable } from "@nestjs/common";
import { BoardModelType} from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class BoardCheckService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async doesBoardExist(board:string):Promise<boolean> {
        const existingBoard = await this.BoardModel.find({name:board}).exec();
        if (existingBoard.length > 0) {
            return true
        }
        return false
    }
}