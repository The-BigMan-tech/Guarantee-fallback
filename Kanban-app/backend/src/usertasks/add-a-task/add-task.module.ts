import { Module } from "@nestjs/common";
import { BoardModel } from "src/boards/schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { allCheckService } from "../common-services/services/common-services.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

import { AddTaskControl } from "./controllers/add-task.controller";
import { AddTaskService } from "./services/add-task.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[AddTaskControl],
    providers:[AddTaskService,allCheckService,BoardCheckService,GroupCheckService]
})
export class AddTaskModule {
    
}