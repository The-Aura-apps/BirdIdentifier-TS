// core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
//import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { APP_INTERCEPTOR, APP_GUARD, APP_PIPE } from '@nestjs/core';
//import { AuthGuard } from './guards/auth.guard';
//import { ValidationPipe } from './pipes/validation.pipe';

@Global()
@Module({
    imports: [DatabaseModule],
    providers: [
        //{ provide: APP_GUARD, useClass: AuthGuard },
        //{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        //{ provide: APP_PIPE, useClass: ValidationPipe },
    ],
    exports: [DatabaseModule],
})
export class CoreModule {}
