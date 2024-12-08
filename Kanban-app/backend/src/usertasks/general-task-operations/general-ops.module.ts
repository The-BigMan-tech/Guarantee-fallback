import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TaskController } from "./controllers/general-ops.controller";
import { TaskOperationsService } from "./services/general-ops.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[TaskController],
    providers:[TaskOperationsService]
})
export class TaskOperationsModule {
    
}