import { Module } from "@nestjs/common";
import { AddTaskModule } from "./add-a-task/add-task.module";

@Module({
    imports:[AddTaskModule]
})
export class TasksModule {

}