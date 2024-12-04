/* eslint-disable prettier/prettier */
//*using @req or @ res tells nest js to use a library specific feature,decorators
//*Subdomains scales using routes
//*promises defers the execution of async code
//* in nest,controllers are mounted onto modules
/**
 * *A controller is a module that handles all the http requests related to a specific route
 * *The module is where everything is mounted,
 * *a router/comtroller is a module that maps routehandlers to defined routes.It is the central hub for all the routehandlers related to a particular route
 * 
 * *We use DTO instead of interface so that it can be incliuded in the js file because interface cant
 * *decorators
 * *nest js common is where all the decorators are
 * 
 * *A provider is an injectable dependency
 * *common controller,service
 * *interface file
 * *dependency injection
 * *A module that contains a class that has the injectable decorator is a provider.It is used for shared dependencies across controllers
 * *Decorator annotations--controller,injectable,module
 * *The module is used by nest to construct the app
 * *the exports of the module makes sure that each controller that uses the module use the same instance if that instance to reduce memory usage and create more predictable behaviour
 * *the @global rule makes a module global scoped such that you can use their providers out of the box without imporing them
 * 
 * *controller,provider,middleware,module
 * *the middleware is an injectable class that implements the NestMiddleware interface
 * !Booked exception filters
 * *the placement of pipes and guards will determine the scope they are available to
 * 
 * *Batteries
 * 
 * *Rxjs
 * *zod
 * 
 * 
 * *mongo--LONG
 * *mvc--SHORT
 * *encryption and hashing,serialization--SHORT
 * *cookie,sessions---SHORT
 * *life cycle event,event---SHORT
 * *circular dependency--SHORT
 * *file upload,streaming files--LONGISH
 * *execution context--MEDIUM
 */
import { Controller,Get,Param, ParseIntPipe} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
@Controller('NoMiddleware')
export class SampleController {
  @Get('getSample')
  getSample():string {
    return 'Sent sample data'
  }
}

@Controller()
export class NewController {
  @Get('newman/:value')
  getNew(@Param('value',ParseIntPipe) value:number):string {
    return `seen dynamic data: ${value}`
  }
}
