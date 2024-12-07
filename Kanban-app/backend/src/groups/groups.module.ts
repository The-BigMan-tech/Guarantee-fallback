import { Module } from "@nestjs/common";
import { AddGroupModule } from "./adding-a-group/add-group.module";
@Module(
    {
        imports:[AddGroupModule]
    }
)
export class GroupModule {
    
}