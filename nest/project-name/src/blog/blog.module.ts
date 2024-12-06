/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { BlogController } from "./blog.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { BlogModel} from "./blog.schema";
import { BlogService } from "./blog.service";

const ModelArray = [BlogModel]//*you can register multiple models here
@Module(
    {
        imports:[MongooseModule.forFeature(ModelArray)],
        controllers:[BlogController],
        providers:[BlogService],
        exports:[]
    }
)
export class BlogModule{
    //No implementation
}