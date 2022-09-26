import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import * as pactum from 'pactum';
import { UsersTesting } from './models/users.testing';
import { NestFactory } from '@nestjs/core';
import { ProjectsTesting } from './models/projects.testing';
import { ProjectUsersTesting } from './models/project-users.testing';
import { EventsTesting } from './models/event.testing';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { cors: true });
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(async () => {
    await app.close();
  })

  // Users tests

  new UsersTesting(app).routeTest();
  new ProjectsTesting(app).routeTest();
  new ProjectUsersTesting(app).routeTest();
  new EventsTesting(app).routeTest();
});
