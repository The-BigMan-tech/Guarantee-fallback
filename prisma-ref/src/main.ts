import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import chalk from 'chalk';
import { requestLoggerMiddleware } from './request-logs.middleware.js';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000
  const app = await NestFactory.create(AppModule);
  app.use(requestLoggerMiddleware);
  await app.listen(PORT);
  console.log(chalk.yellow(`The server is listening on port: ${PORT}`))
}
bootstrap();
