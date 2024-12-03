/* eslint-disable prettier/prettier */
import { Module} from "@nestjs/common";
import { experimentController} from "./experiment.controller";
import { experimentService } from "./experiment.service";
@Module(
    {
        controllers:[experimentController],
        providers:[experimentService],
        exports:[experimentService]
    }
)
export class experimentModule {
    //No implementation
}