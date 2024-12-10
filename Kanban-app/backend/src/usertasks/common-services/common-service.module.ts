import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { BoardCheckService } from "src/boards/common-services/services/board-check.service";
import { GroupCheckService } from "src/groups/common-services/services/group-check.service";

const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    providers:[GroupCheckService,BoardCheckService]
})
export class CommonServicesModule {

}