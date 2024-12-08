import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition,BoardDocumentType} from "src/boards/schemas/board.schema";

@Injectable()
export class BoardDataService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async returnBoard(board:string):Promise<BoardDocumentType[]> {
        return this.BoardModel.find({name:board}).exec();
    }
    public async returnBoardAsString(board:string):Promise<string> {
        const updatedBoard: BoardDefinition = await this.BoardModel.findOne({ name: board}).lean();
        return `UPDATED BOARD", ${JSON.stringify(updatedBoard, null, 2)}` // Use JSON.stringify for better visibility
    }
}