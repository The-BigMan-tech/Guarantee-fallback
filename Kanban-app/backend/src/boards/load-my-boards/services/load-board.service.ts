import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType,BoardDocumentType,BoardDefinition} from '../../schemas/board.schema'

@Injectable()
export class LoadBoardService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    async returnBoards():Promise<BoardDocumentType[]> {
        return this.BoardModel.find().exec();
    }
    async returnBoardsByName():Promise<BoardDocumentType[]> {
        return this.BoardModel.find({},{name:1}).exec();
    }
}