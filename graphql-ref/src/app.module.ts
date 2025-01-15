import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {ConfigModule} from '@nestjs/config'

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { UserResolver } from './sample.resolver.js';
@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [`${process.cwd()}/src/graphql/*.graphql`],
      definitions: {
        path: join(process.cwd(), `./src/graphql/graphql.ts`),
      }
    }),
  ],
  controllers: [AppController],
  providers: [AppService,UserResolver],
})
export class AppModule {}
