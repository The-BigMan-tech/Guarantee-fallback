import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {fc as fastcheck,test} from '@fast-check/jest'


describe('AppController', () => {
    let appController: AppController;
    let appService:AppService

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
            {
                provide:AppService,
                useValue:{
                    getHello:jest.fn().mockReturnValue('Hello World!')
                }
            }
        ],
        }).compile();

        appController = app.get<AppController>(AppController);
        appService = app.get<AppService>(AppService);
    });
    describe('root operations:', () => {
        test.prop({num:fastcheck.integer()})
        ('should always return a number',({num})=>{
            expect(appController.echoNumber(num)).toBe(num)
        })
    });
});
