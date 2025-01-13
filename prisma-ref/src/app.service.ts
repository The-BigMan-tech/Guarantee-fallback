import { Injectable} from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import {User,Prisma,Sample} from '@prisma/client';


@Injectable()
export class AppService {
  constructor(private prisma:PrismaService) {
    //No implementation;
  }
  public async createSample(sampleData:Prisma.SampleCreateInput):Promise<Sample> {
      return await this.prisma.sample.create({data:sampleData})
  }
  public async findSamplebyName(name:string):Promise<Sample> {
    return await this.prisma.sample.findUnique({
      where:{
        username:name
      }
    }) as Sample
  }
  public async findAllSamples():Promise<Sample[]> {
    return await this.prisma.sample.findMany()
  }
}
