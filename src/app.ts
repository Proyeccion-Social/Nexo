import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app,
    new DocumentBuilder().setTitle('Nexo API').setVersion('1.0').addBearerAuth().build()));
  app.enableShutdownHooks();
  return app;
}
