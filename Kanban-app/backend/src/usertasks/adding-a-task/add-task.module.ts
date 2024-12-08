import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TaskController } from "./controllers/add-task.controller";
import { AddTaskService } from "./services/add-task.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[TaskController],
    providers:[AddTaskService]
})
export class AddTaskModule {
    
}