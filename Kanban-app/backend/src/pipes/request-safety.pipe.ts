import { Injectable, PipeTransform, ArgumentMetadata, Type, BadGatewayException } from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

@Injectable()
export class RequestSafetyPipe implements PipeTransform{
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