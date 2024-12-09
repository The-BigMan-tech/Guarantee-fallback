import { Module } from "@nestjs/common";
import { CreateBoard } from "./controllers/create-board.controller.js";
import { BoardModel} from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { CreateBoardService } from "./services/create-board.service.js";
import { CommonServicesModule } from "../common-services/common-services.module";
import { BoardCheckService } from "../common-services/services/board-check.service";
import { BoardDataService } from "../common-services/services/get-board-data.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[CreateBoard],
    providers:[CreateBoardService,BoardCheckService,BoardDataService]
})
export class CreateBoardModule {

}