import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType,BoardDocumentType,BoardDefinition} from "../schemas/board.schema";

@Injectable()
export class CreateBoardService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async createBoard(board:BoardDefinition):Promise<BoardDocumentType> {
        return this.BoardModel.create(board)
    }
    async doesBoardExist(board:BoardDefinition):Promise<boolean> {
        if (this.BoardModel.find({name:board.name}).exec()) {
            return true
        }
        return false
    }
    async returnBoard(board:BoardDefinition):Promise<BoardDocumentType[]> {
        return this.BoardModel.find({name:board.name}).exec();
    }
    async returnBoards():Promise<BoardDocumentType[]> {
        return this.BoardModel.find().exec();
    }
}