/* eslint-disable prettier/prettier */
import {z} from 'zod';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString,Min} from 'class-validator'

export const commentSchema = z.object({
    email:z.string().email('Must be a valid email'),
    comment:z.string()
});
export class commentDtoClass {
    email:string;
    comment:string;
}


export class commentClass {
    @IsNotEmpty()
    @IsString()
    username:string;

    @IsNotEmpty()
    @IsEmail()
    email:string;

    @IsNotEmpty()
    @IsInt()
    phoneNum:number;

    @IsInt()
    @IsOptional()
    @Min(0)
    age:number
}