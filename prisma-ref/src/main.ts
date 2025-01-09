import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import chalk from 'chalk';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  console.log(chalk.green(`The server is listening on port: ${PORT}`));
}
bootstrap();
