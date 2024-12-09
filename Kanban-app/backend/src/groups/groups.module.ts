import { Module } from "@nestjs/common";
import { AddGroupModule } from "./add-a-group/add-group.module";
import { DeleteGroupModule } from "./delete-a-group/delete-group.module";
import { EditGroupModule } from "./edit-group-name/edit-group-name.module";

@Module(
    {
        imports:[AddGroupModule,DeleteGroupModule,EditGroupModule]
    }
)
export class GroupModule {
    
}