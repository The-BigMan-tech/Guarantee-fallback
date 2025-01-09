import { Controller, Get,Post,Body} from '@nestjs/common';
import { AppService } from './app.service';

interface user {
  name:string,
  email:string
}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/createUser')
  public async createUser(@Body() body:user) {
      return this.appService.createUser(body)
  }

  @Get('/allUsers')
  public async getUsers() {
      return this.appService.getUsers()
  }
}
