import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import TestAgent from 'supertest/lib/agent';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let requestToServer:TestAgent<request.Test>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    requestToServer = request(app.getHttpServer()) 
  });

  it('/ (GET)', () => {
    return requestToServer.get('/two')
      .expect(200)
      .expect('10');
  });
  it('',()=>{
    return requestToServer.get('/echo/2')
      .expect(200)
      .expect('2')
  })
  it('should return the average',()=>{
    return requestToServer.post('/average').send([1,2,3])
      .expect(201)
      .expect('2')
  })
});
