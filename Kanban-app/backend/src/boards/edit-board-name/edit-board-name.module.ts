import { Module } from "@nestjs/common";
import { BoardModel} from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { EditBoard } from "./controllers/edit-board-name.controller";
import { EditBoardService } from "./services/edit-board-name.service";
import { BoardCheckService } from "../common-services/services/board-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[EditBoard],
    providers:[EditBoardService,BoardCheckService]
})
export class EditBoardModule {
    
}