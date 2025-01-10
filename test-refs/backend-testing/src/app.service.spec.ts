import { Test,TestingModule } from "@nestjs/testing";
import { AppService } from "./app.service";

describe('App Service',()=>{
    let appService:AppService;

    beforeEach(async ()=>{
        const app:TestingModule = await Test.createTestingModule({
            providers:[AppService]
        }).compile()
        appService = app.get<AppService>(AppService)
    })
    describe('root operations:',()=>{
        it('should return Hello World!',()=>{
            expect(appService.getHello()).toBe('Good morning')
        })
    })
})
