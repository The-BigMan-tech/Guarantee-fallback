/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class BlogDB {
    @Prop()
    name: string;

    @Prop()
    age: number;

}
export const BlogSchema = SchemaFactory.createForClass(BlogDB);
export type BlogDoc = HydratedDocument<BlogDB>;

