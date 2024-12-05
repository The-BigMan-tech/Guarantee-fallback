/* eslint-disable prettier/prettier */
import {Injectable,PipeTransform,BadGatewayException,ArgumentMetadata,Type} from '@nestjs/common';
import { commentSchema } from './comment';
import { ZodError } from 'zod';
import { commentDtoClass} from './comment';

import { validate } from 'class-validator';
import {plainToInstance} from 'class-transformer';
/**
 * *In a pipe,the validation code is a one liner.The rest of the pipe's body is boilerplate,error catching and deciding which values will bypass the validation
 * *A pipe either returns the value unchanged or an exception
*/
@Injectable()
export class CommentPipe implements PipeTransform {
    transform(value:unknown,{metatype}:ArgumentMetadata,) {
        if (metatype !== commentDtoClass) return value;
        try {
            return commentSchema.safeParse(value)
        }catch(err) {
            if (err instanceof ZodError) throw new BadGatewayException(err.errors);
            throw err;
        }
    }
}
/**
 * *Type<any> means it is a constructor that returns a type of any
 */
@Injectable()
export class ClassPipe implements PipeTransform{
    async transform(value:unknown,{metatype}:ArgumentMetadata):Promise<unknown> {
        if (this.isaPrimitiveConstructor(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype,value);
        const errors = await validate(object);
        if (errors.length) {
            throw new BadGatewayException(errors);
        }
        return value;
    }
    /**
     * *Checks if the given metatype is a primitive datatype constructor.It returns true if it is else,false
     */
    private isaPrimitiveConstructor(metatype:Type<any>): boolean {
        const primitives:(Type<any>)[] = [String, Boolean, Number, Array, Object];
        if (!metatype || primitives.includes(metatype)) {
            return true
        }
        return false
    }
}