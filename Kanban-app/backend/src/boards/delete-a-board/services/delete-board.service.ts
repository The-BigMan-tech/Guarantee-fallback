import { Injectable } from "@nestjs/common";
import { BoardModelType } from "src/boards/schemas/board.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class DeleteBoardService {
    constructor(@InjectModel('Board') private boardModel:BoardModelType) {
        //No implementation
    }
    public async deleteBoard(boardName:string):Promise<void> {
        await this.boardModel.deleteOne({name:boardName}).exec()
    }   
}