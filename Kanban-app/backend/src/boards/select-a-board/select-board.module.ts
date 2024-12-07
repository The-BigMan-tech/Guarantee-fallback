import { Module } from "@nestjs/common";
import { BoardDataService } from "../common-services/services/get-board-data.service";
import { SelectBoard } from "./controllers/select-board.controller";
import { BoardModel } from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { BoardCheckService } from "../common-services/services/board-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[SelectBoard],
    providers:[BoardDataService,BoardCheckService]
})
export class SelectBoardModule {

}