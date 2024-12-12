import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument,Model} from 'mongoose';
import { GroupDTO } from 'src/groups/dto/groups.dto';

@Schema()
export class BoardDefinition {
    @Prop()
    name:string

    @Prop()
    groups:GroupDTO[] 

    @Prop()
    isSelected:boolean
}

export type BoardDocumentType = HydratedDocument<BoardDefinition>
export type BoardModelType = Model<BoardDocumentType>

export const BoardSchema = SchemaFactory.createForClass(BoardDefinition)
export const BoardModel = {name:'Board',schema:BoardSchema}