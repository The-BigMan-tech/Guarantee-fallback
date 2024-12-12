import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";
import { BoardDefinition,BoardDocumentType} from "src/boards/schemas/board.schema";

@Injectable()
export class BoardDataService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async returnBoard(board:string):Promise<BoardDocumentType> {
        return await this.BoardModel.findOne({name:board}).exec();
    }
    public async returnBoards():Promise<BoardDocumentType[]> {
        return this.BoardModel.find().exec();
    }
    public async selectBoard(boardName:string):Promise<void> {
        await this.BoardModel.updateMany({},{$set:{isSelected:false}}).exec()
        await this.BoardModel.updateOne({name:boardName},{$set:{isSelected:true}}).exec()
    }
    public async returnBoardAsString(board:string):Promise<string> {
        const theBoard:BoardDefinition = await this.BoardModel.findOne({ name: board}).lean();
        return JSON.stringify(theBoard, null, 2) // Use JSON.stringify for better visibility
    }
}