import { Module } from "@nestjs/common";
import { AddTaskModule } from "./add-a-task/add-task.module";
import { DeleteTaskModule } from "./delete-a-task/delete-task.module";
import { EditTaskModule } from "./edit-a-task/edit-task.module";
import { ViewTaskModule } from "./view-a-task/view-task.module";

@Module({
    imports:[AddTaskModule,DeleteTaskModule,EditTaskModule,ViewTaskModule]
})
export class TasksModule {

}