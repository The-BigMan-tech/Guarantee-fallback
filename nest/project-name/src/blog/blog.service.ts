/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { BlogDB,BlogDoc} from "./blog.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class BlogService {
    constructor(@InjectModel(BlogDB.name) private blogModel:Model<BlogDoc>) {
        //No implementation
    }
    async create(createUserDto):Promise<BlogDB> {
        const createdUser = new this.blogModel(createUserDto);
        return createdUser.save(); // Inserts the document
    }
    async findBlogs():Promise<BlogDB[]> {
        return this.blogModel.find().exec();
    }
}