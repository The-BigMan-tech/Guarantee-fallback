import { Module } from "@nestjs/common";
import {BoardCheckService } from "./services/board-check.service";
import { BoardDataService } from "./services/get-board-data.service";
import { BoardModel } from "../schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    providers:[BoardCheckService,BoardDataService]
})
export class CommonServicesModule {

}