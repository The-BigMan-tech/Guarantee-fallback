import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';


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
    it('should mock the service',()=>{
      jest.spyOn(appService,'getHello').mockReturnValue('hello')
      expect(appController.getHello()).toBe('hello')
    })
    it('should return a number',async()=>{
      const result:number = await appController.getTwo()
      expect(result).toBe(10)
    })
    it('should return the average of the given numbers',()=>{
      expect(appController.getAvg([1,2,3])).toBe(2)
    })
    it('should echo back a number',()=>{
      expect(appController.echoNumber(1)).toBe(1)
    })
  });
});
