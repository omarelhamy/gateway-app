import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // CORS only in dev (frontend on port 5173)
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({ origin: 'http://localhost:5173' });
  }

  // Serve React build only in production
  if (process.env.NODE_ENV === 'production') {
    const buildPath = join(__dirname, '..', '..', 'frontend', 'dist');
    app.use(express.static(buildPath));
    // Serve SPA for non-API routes
    app.getHttpAdapter().get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).send();
      res.sendFile(join(buildPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
bootstrap();
