/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { experimentDto } from './experiment.dto';
import { experimentService } from './experiment.service';

@Controller('experiment')
export class experimentController {
    constructor(private experimentService:experimentService) {
        //No implementation
    }
    @Get()
    public getHello():string {
        return 'Hello';
    }
    @Post('/postData')
    public postHello(@Body() body:experimentDto):void {
        this.experimentService.store(body.name)
        return;
    }
    @Get('/getData')
    public getStorage():string[] {  
        return this.experimentService.returnStorage()
    } 
}
