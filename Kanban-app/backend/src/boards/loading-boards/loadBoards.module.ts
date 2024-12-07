import { Module } from "@nestjs/common";
import { LoadBoard } from "./controllers/load-board.controller";
import { LoadBoardService } from "./services/load-board.service";
import { BoardModel } from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[LoadBoard],
    providers:[LoadBoardService]
})
export class LoadBoardModule {
    //No implemenation
}