import { Controller, Get,Post,Body,UsePipes} from '@nestjs/common';
import { AppService } from './app.service.js';
import {sampleSchema,sampleDTO} from './app-layer-schemas.js';
import { ZodPipe } from './zod-pipe.pipe.js';
import {ConflictException} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/createSample')
  @UsePipes(new ZodPipe(sampleSchema))
  public async createSample(@Body() body:sampleDTO) {
      try {
        let data = await this.appService.createSample(body)
        let message = `Successfully posted the data`
        const response = {
          message:message,
          data:data
        }
        return response
      }catch(error:unknown) {
        if (error instanceof PrismaClientKnownRequestError) {
          throw new ConflictException(
            {message:'The following data has to be unique',conflicts:error.meta?.target}
          )
        }
      }
  }
}
