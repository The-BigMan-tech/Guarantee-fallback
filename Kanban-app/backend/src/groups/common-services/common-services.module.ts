import { BoardModel } from "src/boards/schemas/board.schema"
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GroupCheckService } from "./services/group-check.service";


const ModelArray = [BoardModel]
@Module({
    imports:[MongooseModule.forFeature(ModelArray)],
    providers:[GroupCheckService]
})
export class CommonServicesModule {

}