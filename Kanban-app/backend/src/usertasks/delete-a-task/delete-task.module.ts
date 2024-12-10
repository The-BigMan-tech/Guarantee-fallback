import { Module } from "@nestjs/common";
import { BoardModel } from "src/boards/schemas/board.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { allCheckService } from "../common-services/services/common-services.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

import { DeleteTaskControl } from "./controllers/delete-task.controller";
import { DeleteTaskService } from "./services/delete-task.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[DeleteTaskControl],
    providers:[DeleteTaskService,allCheckService,BoardCheckService,GroupCheckService]
})
export class DeleteTaskModule {
    
}