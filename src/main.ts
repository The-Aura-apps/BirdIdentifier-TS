import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
    ); // Or use plainToInstance IN controler
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('My API Docs')
        .setDescription('Swagger for NestJS')
        .setVersion('1.0')
        .addBearerAuth() // For JWT Auth
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
