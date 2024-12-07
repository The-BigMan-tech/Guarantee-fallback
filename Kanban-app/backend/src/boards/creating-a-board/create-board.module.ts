import { Module } from "@nestjs/common";
import { CreateBoard } from "./controllers/create-board.controller";
import { BoardModel} from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { CreateBoardService } from "./services/create-board.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[CreateBoard],
    providers:[CreateBoardService]
})
export class CreateBoardModule {

}