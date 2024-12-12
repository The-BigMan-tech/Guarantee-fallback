import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class EditBoardService {
    constructor(@InjectModel('Board') private boardModel:BoardModelType) {
        //No implementation
    }
    public async editBoard(oldBoardName:string,newBoardName:string):Promise<void> {
        await this.boardModel.updateOne({name:oldBoardName},{$set:{name:newBoardName}}).exec()
    }
}