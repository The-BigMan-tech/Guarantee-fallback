import { Module } from "@nestjs/common";
import { AddTaskModule } from "./adding-a-task/add-task.module";

@Module({
    imports:[AddTaskModule]
})
export class TasksModule {

}