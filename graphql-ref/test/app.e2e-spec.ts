import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module.js';
import TestAgent from 'supertest/lib/agent.js';
import * as request from 'supertest'

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let requestToServer:TestAgent<request.Test>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    requestToServer = request.agent(app.getHttpServer()) 
  });

  it('/ (GET)', () => {
    return requestToServer
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
