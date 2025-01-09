import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value:any) {
        const parsed = this.schema.safeParse(value);
        if (!parsed.success) throw new BadRequestException(parsed.error.errors);
        return parsed.data;
    }
}