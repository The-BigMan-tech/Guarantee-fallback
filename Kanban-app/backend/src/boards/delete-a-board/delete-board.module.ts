import { Module } from "@nestjs/common";
import { BoardModel} from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { DeleteBoard } from "./controllers/delete-board.controller";
import { DeleteBoardService } from "./services/delete-board.service";
import { BoardCheckService } from "../common-services/services/board-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[DeleteBoard],
    providers:[DeleteBoardService,BoardCheckService]
})
export class DeleteBoardModule {

}