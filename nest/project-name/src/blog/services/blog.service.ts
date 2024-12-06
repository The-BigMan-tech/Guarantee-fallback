/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import {BlogDocument,BlogModelType} from "../models/blog.schema";
import { InjectModel } from "@nestjs/mongoose";


@Injectable()
export class BlogService {
    constructor(@InjectModel('Blog') private BlogModel:BlogModelType) {
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