import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AddTaskController } from "./controllers/add-task.controller";
import { AddTaskService } from "./services/add-task.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[AddTaskController],
    providers:[AddTaskService]
})
export class AddTaskModule {
    
}