import { Module } from "@nestjs/common";
import { BoardModel} from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { DeleteBoard } from "./controllers/delete-board.controller";
import { DeleteBoardService } from "./services/delete-board.service";
import { CreateBoardService } from "../creating-a-board/services/create-board.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[DeleteBoard],
    providers:[DeleteBoardService,CreateBoardService]
})
export class DeleteBoardModule {

}