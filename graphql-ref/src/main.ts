import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT ?? 3000
  await app.listen(PORT);
  console.log(chalk.yellow(`The server is listening on port ${PORT}`));
}
bootstrap();
