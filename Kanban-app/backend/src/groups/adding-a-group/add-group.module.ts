import { BoardModel } from "src/boards/schemas/board.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AddGroup } from "./controllers/add-group.controller";
import { AddGroupService } from "./services/add-group.service";
import { GroupCheckService } from "../common-services/services/group-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    controllers:[AddGroup],
    providers:[AddGroupService,GroupCheckService]
})
export class AddGroupModule {
    
}
