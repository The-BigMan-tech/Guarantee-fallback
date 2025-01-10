/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument,Model} from 'mongoose';

@Schema()
export class BlogDefinition {
    @Prop()
    name: string;

    @Prop()
    age: number;
}
//*exporting types
export type BlogDocument = HydratedDocument<BlogDefinition>;
export type BlogModelType = Model<BlogDocument>;

//*exporting variables
export const BlogSchema = SchemaFactory.createForClass(BlogDefinition);//*the actual schema object
export const BlogModel = {name:'Blog',schema:BlogSchema}