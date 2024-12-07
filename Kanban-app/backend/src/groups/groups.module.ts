import { Module } from "@nestjs/common";
import { AddGroupModule } from "./adding-a-group/add-group.module";
import { DeleteGroupModule } from "./deleting-a-group/delete-group.module";

@Module(
    {
        imports:[AddGroupModule,DeleteGroupModule]
    }
)
export class GroupModule {
    
}