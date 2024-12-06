/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class BlogDefinition {
    @Prop()
    name: string;

    @Prop()
    age: number;
}
export type BlogDocument = HydratedDocument<BlogDefinition>;
export const BlogSchema = SchemaFactory.createForClass(BlogDefinition);//*the actual schema
export const BlogModel = {name:'Blog',schema:BlogSchema}