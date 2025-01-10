import { Controller, Get,Param,Post,Body} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }
  @Get('/echo/:num')
  public echoNumber(@Param('num') num:number):number {
      return num
  }
  @Get('two')
  public async getTwo():Promise<number> {
    return 10
  }
  @Post('average')
  public getAvg(@Body() numbers:number[]):number {
      let sum:number = 0
      for (let number of numbers) {
        sum += number
      }
      return sum/numbers.length;
  }
}
