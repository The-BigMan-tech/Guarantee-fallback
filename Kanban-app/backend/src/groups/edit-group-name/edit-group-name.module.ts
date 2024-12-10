import { BoardModel } from "src/boards/schemas/board.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GroupCheckService } from "../common-services/services/group-check.service";
import { BoardCheckService } from "src/boards/common-services/services/board-check.service";

import {EditGroup } from "./controllers/edit-group-name.controller";
import { EditGroupService } from "./services/edit-group-name.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[EditGroup],
    providers:[EditGroupService,GroupCheckService,BoardCheckService]
})
export class EditGroupModule {
    
}