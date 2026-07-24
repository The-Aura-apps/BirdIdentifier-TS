import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables BEFORE creating the app
dotenv.config();

async function bootstrap() {
    // Verify API key is loaded
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY not found in environment variables!');
        process.exit(1);
    }

    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
        origin: '*', // Change this in production
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Bird Identifier API')
        .setDescription('Bird Identifier Backend API')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';

    await app.listen(port, host);
}
bootstrap();
