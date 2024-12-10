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
    public async deleteAll():Promise<void | string> {
        const anyBoard = await this.boardModel.find().exec()
        console.log(anyBoard);
        if (!anyBoard.length) {
            return 'nothing found'
        }
        await this.boardModel.deleteMany({}).exec()
    }
}