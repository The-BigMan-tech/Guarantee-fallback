import { Injectable} from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import {User,Prisma } from '@prisma/client';


@Injectable()
export class AppService {
  constructor(private prisma:PrismaService) {
    //No implementation;
  }
  public async createUser(userData:Prisma.UserCreateInput):Promise<User>{
      return this.prisma.user.create({
          data:{
            name:userData.name,
            email:userData.email,
            details:userData.details
          }
      });
  }
  public async getUsers():Promise<User[]> {
      return this.prisma.user.findMany()
  }
}
