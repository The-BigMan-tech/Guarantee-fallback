import { Module } from "@nestjs/common";
import { AddTaskModule } from "./add-a-task/add-task.module";
import { DeleteTaskModule } from "./delete-a-task/delete-task.module";

@Module({
    imports:[AddTaskModule,DeleteTaskModule]
})
export class TasksModule {

}