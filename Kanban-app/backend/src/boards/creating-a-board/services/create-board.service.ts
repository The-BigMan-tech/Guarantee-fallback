import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType,BoardDocumentType,BoardDefinition} from "../schemas/board.schema";

@Injectable()
export class CreateBoardService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async createBoard(board:BoardDefinition):Promise<BoardDocumentType> {
        return
    }
}