/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import {BlogDocument} from "./blog.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class BlogService {
    constructor(@InjectModel('Blog') private BlogModel:Model<BlogDocument>) {
        //No implementation
    }
    async create(createUserDto):Promise<BlogDocument> {
        const createdUser = new this.BlogModel(createUserDto);
        return createdUser.save(); // Inserts the document
    }
    async findBlogs():Promise<BlogDocument[]> {
        return this.BlogModel.find().exec();
    }
}