/* eslint-disable prettier/prettier */
import { Module, NestModule,MiddlewareConsumer, RequestMethod} from '@nestjs/common';
import { AppController, SampleController,NewController} from './app.controller';
import { AppService } from './app.service';
import { experimentModule } from './experiment/experiment.module';
import { experimentMiddleware,functionalMiddleware} from './experiment/experiment.middleware';
import { blogModule } from './blog/blog.module';
import {MongooseModule} from '@nestjs/mongoose'
import { Connection } from 'mongoose';
@Module(
  {
    imports:[
      experimentModule,blogModule,
      MongooseModule.forRoot('mongodb://localhost:27017/MY_DATABASE',
        {
          onConnectionCreate:(connection:Connection)=>{
              connection.on('connected',()=>console.log('Database connection successful'))
              connection.on('error',()=>console.log('Database connection error'))
              connection.on('disconnected',()=>console.log("Database disconnected"))
          }
        }
      )
    ],
    controllers: [AppController,SampleController,NewController],
    providers: [AppService],
  }
)
export class AppModule implements NestModule {
    configure(consumer:MiddlewareConsumer) {
      consumer
        .apply(experimentMiddleware)//*you can use comma separated values for multiple middlewares
        .exclude({path:'NoMiddleware',method:RequestMethod.ALL})
        .forRoutes({path:'/experiment',method: RequestMethod.ALL})//*can take a single string,a controller,routeinfo objects

      consumer
        .apply(functionalMiddleware)
        .forRoutes('NoMiddleware')
    }
}
