import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT ?? 4000
  const app = await NestFactory.create(AppModule);
  console.log('RUNNING ON PORT: ',PORT);
  await app.listen(PORT);
}
bootstrap();
