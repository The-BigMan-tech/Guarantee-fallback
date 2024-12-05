/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { BlogController } from "./blog.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { BlogDB,BlogSchema } from "./blog.schema";
import { BlogService } from "./blog.service";
@Module(
    {
        imports:[MongooseModule.forFeature([{name:BlogDB.name,schema:BlogSchema}])],
        controllers:[BlogController],
        providers:[BlogService],
        exports:[]
    }
)
export class blogModule{
    //No implementation
}