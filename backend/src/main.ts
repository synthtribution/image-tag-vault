import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno del archivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const PORT = process.env.PORT || 3001;
  const IMAGES_DIR = process.env.IMAGES_DIR;
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

  if (!IMAGES_DIR) {
    console.error('Error: La variable de entorno IMAGES_DIR no está definida.');
    process.exit(1);
  }

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET'],
  });

  // Servir las imágenes locales de forma estática en la ruta /imagenes
  app.use('/imagenes', express.static(IMAGES_DIR));

  await app.listen(PORT);
  console.log(`Servidor NestJS corriendo en http://localhost:${PORT}`);
  console.log(`Imágenes servidas estáticamente en http://localhost:${PORT}/imagenes`);
}

bootstrap();
