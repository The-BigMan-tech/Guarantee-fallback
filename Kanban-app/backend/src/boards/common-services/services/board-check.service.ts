import { Injectable } from "@nestjs/common";
import { BoardModelType} from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition } from "src/boards/schemas/board.schema";

@Injectable()
export class BoardCheckService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async doesBoardExist(board:string):Promise<boolean> {
        const existingBoard:BoardDefinition = await this.BoardModel.findOne({name:board}).exec();
        if (existingBoard) {
            return true
        }
        return false
    }
}