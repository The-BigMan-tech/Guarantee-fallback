import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {ConfigModule} from '@nestjs/config'
import { PrismaService } from './prisma.service.js';
import { ZodPipe } from './zod-pipe.pipe.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule {}
