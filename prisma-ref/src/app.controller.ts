import { Controller, Get,Post,Body,UsePipes} from '@nestjs/common';
import { AppService } from './app.service.js';
import { userDTO,userSchema} from './user.dto.js';
import { ZodPipe } from './zod-pipe.pipe.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/createUser')
  @UsePipes(new ZodPipe(userSchema))
  public async createUser(@Body() body:userDTO) {
      return this.appService.createUser(body);
  }
  
  @Get('/allUsers')
  public async getUsers() {
      return this.appService.getUsers()
  }
}
