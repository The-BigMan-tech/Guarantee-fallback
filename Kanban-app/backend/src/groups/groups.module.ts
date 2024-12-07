import { Module } from "@nestjs/common";
import { AddGroupModule } from "./add-a-group/add-group.module";
import { DeleteGroupModule } from "./delete-a-group/delete-group.module";

@Module(
    {
        imports:[AddGroupModule,DeleteGroupModule]
    }
)
export class GroupModule {
    
}