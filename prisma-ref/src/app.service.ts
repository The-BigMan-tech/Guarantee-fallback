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
}
