import { BoardModel } from "src/boards/schemas/board.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GroupCheckService } from "../common-services/services/group-check.service";

import { DeleteGroup } from "./controllers/delete-group.controller";
import { DeleteGroupService } from "./services/delete-group.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[DeleteGroup],
    providers:[DeleteGroupService,GroupCheckService,BoardCheckService]
})
export class DeleteGroupModule {
    
}