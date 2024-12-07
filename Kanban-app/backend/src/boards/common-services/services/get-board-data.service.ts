import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition,BoardDocumentType} from "src/boards/schemas/board.schema";

@Injectable()
export class BoardDataService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async returnBoard(board:string):Promise<BoardDocumentType[]> {
        return this.BoardModel.find({name:board}).exec();
    }
}