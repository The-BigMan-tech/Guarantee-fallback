import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BoardModelType,BoardDocumentType, BoardDefinition} from "src/boards/schemas/board.schema";

@Injectable()
export class AddGroupService {
    constructor(@InjectModel('Board') private BoardModel:BoardModelType) {
        //No implementation
    }
    public async addGroup(boardName:string,groupName:string):Promise<void> {
        await this.BoardModel.updateOne(
            {name:boardName},
            {$push:{groups:{name:groupName,tasks:[]}}}
        ).exec();
    }
}