import { Module } from "@nestjs/common";
import { TaskOperationsModule } from "./general-task-operations/general-ops.module";

@Module({
    imports:[TaskOperationsModule]
})
export class TasksModule {

}