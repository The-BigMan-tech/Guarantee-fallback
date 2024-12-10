import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EditTaskController } from "./controllers/edit-task.controller";
import { EditTaskService } from "./services/edit-task.service";
import { allCheckService } from "../common-services/services/common-services.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[EditTaskController],
    providers:[EditTaskService,allCheckService,BoardCheckService,GroupCheckService]
})
export class EditTaskModule {
    
}