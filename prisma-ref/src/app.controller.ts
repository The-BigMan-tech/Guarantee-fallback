import { Controller, Get,Post,Body,UsePipes,Param} from '@nestjs/common';
import { AppService } from './app.service.js';
import {sampleSchema,sampleDTO} from './app-layer-schemas.js';
import { ZodPipe } from './zod-pipe.pipe.js';
import {ConflictException,InternalServerErrorException,NotFoundException} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Sample } from '@prisma/client';

interface ResponseObject<T=unknown> {
    message:string,
    data:T
}
function returnResponse<T>(message:string,data:T):ResponseObject<T> {
    return {message:message,data:data}
}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/createSample')
  @UsePipes(new ZodPipe(sampleSchema))
  public async createSample(@Body() body:sampleDTO) {
      try {
          let data:Sample = await this.appService.createSample(body)
          let message:string = `Successfully posted the data`
          return returnResponse<Sample>(message,data)
      }catch(error:unknown) {
          switch(true) {
              case error instanceof PrismaClientKnownRequestError:
                throw new ConflictException(
                  {message:'The fields in the conflicts must be unique',conflicts:error.meta?.target}
                )
              default:
                throw new InternalServerErrorException('An unkown server error occured')
          }
      }
  }
  @Get('/getSample/:sample')
  public async getSample(@Param('sample') sample:string) {
      let data:Sample = await this.appService.findSamplebyName(sample) 
      if (data === null) {
          throw new NotFoundException({message:`${sample} not found`})
      }
      let message = 'Successfully fetched the sample'
      return returnResponse(message,data)
  }
  @Get('/getAllSamples')
  public async getAllSamples() {
    let data = await this.appService.findAllSamples()
    if (data === null) {
      throw new NotFoundException({message:'No boards found'})
    }
    let message = 'Sucessfully fetched all samples'
    return returnResponse(message,data)
  }
}
