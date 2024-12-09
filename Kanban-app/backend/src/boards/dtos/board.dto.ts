import {IsNotEmpty, IsOptional, IsString} from 'class-validator'
import { GroupDTO } from 'src/groups/dto/groups.dto'

export class BoardDTO {
    @IsNotEmpty()
    @IsString()
    name:string;

    @IsOptional()
    groups:GroupDTO[]
}
export class EditBoardDTO {
    @IsString()
    @IsNotEmpty()
    oldBoardName:string;

    @IsString()
    @IsNotEmpty()
    newBoardName:string;
}