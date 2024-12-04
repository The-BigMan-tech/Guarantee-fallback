/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { BlogController } from "./blog.controller";
@Module(
    {
        imports:[],
        controllers:[BlogController],
        providers:[],
        exports:[]
    }
)
export class blogModule{
    //No implementation
}